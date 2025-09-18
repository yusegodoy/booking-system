const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-system');

// Vehicle Type Schema (simplified for this script)
const vehicleTypeSchema = new mongoose.Schema({
  name: String,
  distanceTiers: [{
    fromMiles: Number,
    toMiles: Number,
    pricePerMile: Number,
    description: String
  }],
  basePrice: Number,
  stopCharge: Number,
  childSeatCharge: Number,
  roundTripDiscount: Number
});

const VehicleType = mongoose.model('VehicleType', vehicleTypeSchema);

async function fixDistanceTiers() {
  try {
    console.log('🔧 Fixing distance tiers for all vehicle types...\n');

    // Get all vehicle types
    const vehicleTypes = await VehicleType.find({});
    
    if (vehicleTypes.length === 0) {
      console.log('❌ No vehicle types found in database');
      return;
    }

    console.log(`📊 Found ${vehicleTypes.length} vehicle types`);

    for (const vehicleType of vehicleTypes) {
      console.log(`\n🚗 Processing: ${vehicleType.name}`);
      console.log(`   Current tiers:`, vehicleType.distanceTiers);

      // Check if tiers are properly configured
      let needsUpdate = false;
      let updatedTiers = [...vehicleType.distanceTiers];

      // If no tiers exist, create default tiers
      if (!updatedTiers || updatedTiers.length === 0) {
        console.log('   ⚠️  No distance tiers found, creating default tiers...');
        updatedTiers = [
          { fromMiles: 0, toMiles: 13, pricePerMile: 4, description: 'Short distance (0-13 additional miles)' },
          { fromMiles: 13, toMiles: 25, pricePerMile: 3.5, description: 'Medium distance (13-25 additional miles)' },
          { fromMiles: 25, toMiles: 50, pricePerMile: 3, description: 'Long distance (25-50 additional miles)' },
          { fromMiles: 50, toMiles: 0, pricePerMile: 2.5, description: 'Extended distance (50+ additional miles)' }
        ];
        needsUpdate = true;
      } else {
        // Check if tiers are properly ordered and have correct structure
        updatedTiers.sort((a, b) => a.fromMiles - b.fromMiles);
        
        // Ensure the last tier has toMiles = 0 (unlimited)
        if (updatedTiers.length > 0) {
          const lastTier = updatedTiers[updatedTiers.length - 1];
          if (lastTier.toMiles !== 0) {
            console.log('   ⚠️  Last tier should have toMiles = 0 (unlimited), fixing...');
            lastTier.toMiles = 0;
            lastTier.description = lastTier.description || 'Extended distance';
            needsUpdate = true;
          }
        }

        // Check for gaps in tiers
        for (let i = 0; i < updatedTiers.length - 1; i++) {
          const currentTier = updatedTiers[i];
          const nextTier = updatedTiers[i + 1];
          
          if (currentTier.toMiles !== nextTier.fromMiles) {
            console.log(`   ⚠️  Gap found between tiers ${i} and ${i + 1}, fixing...`);
            currentTier.toMiles = nextTier.fromMiles;
            needsUpdate = true;
          }
        }
      }

      if (needsUpdate) {
        console.log('   ✅ Updated tiers:', updatedTiers);
        
        // Update the vehicle type
        await VehicleType.findByIdAndUpdate(vehicleType._id, {
          distanceTiers: updatedTiers,
          baseDistanceThreshold: 12 // Set default base threshold
        });
        
        console.log('   💾 Saved to database');
      } else {
        console.log('   ✅ Tiers are already properly configured');
      }

      // Test calculation with 71.4 miles using new logic
      console.log('   🧪 Testing calculation with 71.4 miles (new logic):');
      const basePrice = vehicleType.basePrice || 55;
      const baseThreshold = vehicleType.baseDistanceThreshold || 12;
      const totalDistance = 71.4;
      
      let totalPrice = basePrice;
      
      if (totalDistance <= baseThreshold) {
        console.log(`      Distance (${totalDistance} miles) ≤ threshold (${baseThreshold} miles): Base price only = $${basePrice}`);
      } else {
        const additionalDistance = totalDistance - baseThreshold;
        console.log(`      Distance (${totalDistance} miles) > threshold (${baseThreshold} miles)`);
        console.log(`      Base price: $${basePrice}`);
        console.log(`      Additional distance: ${additionalDistance} miles`);
        
        // Calculate additional distance using tiers
        let remainingAdditionalDistance = additionalDistance;
        
        for (const tier of updatedTiers) {
          if (remainingAdditionalDistance <= 0) break;
          
          const tierStart = tier.fromMiles;
          const tierEnd = tier.toMiles === 0 ? Infinity : tier.toMiles;
          const distanceInThisTier = Math.max(0, Math.min(remainingAdditionalDistance, tierEnd - tierStart));
          
          if (distanceInThisTier > 0) {
            const tierPrice = distanceInThisTier * tier.pricePerMile;
            totalPrice += tierPrice;
            console.log(`      Tier ${tierStart}-${tier.toMiles === 0 ? '∞' : tier.toMiles}: ${distanceInThisTier} × $${tier.pricePerMile} = $${tierPrice}`);
            remainingAdditionalDistance -= distanceInThisTier;
          }
          
          if (tier.toMiles === 0 && remainingAdditionalDistance > 0) {
            const unlimitedTierPrice = remainingAdditionalDistance * tier.pricePerMile;
            totalPrice += unlimitedTierPrice;
            console.log(`      Tier ${tierStart}+: ${remainingAdditionalDistance} × $${tier.pricePerMile} = $${unlimitedTierPrice}`);
            remainingAdditionalDistance = 0;
          }
        }
      }
      
      console.log(`      Final total: $${totalPrice.toFixed(2)}`);
    }

    console.log('\n✅ Distance tiers fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing distance tiers:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the fix
fixDistanceTiers(); 
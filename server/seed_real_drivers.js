const mongoose = require('mongoose');
const URI = "mongodb+srv://muzamilmohammadk:Muzamil789@cluster0.r2ah3ab.mongodb.net/?appName=Cluster0";

const Driver = require('./models/Driver');

async function seed() {
    try {
        await mongoose.connect(URI);
        console.log('Connected');

        const driversData = [
            {
                name: "Dinesh",
                email: "dinesh@example.com",
                phone: "9823175701",
                password: "Password123!",
                isOnline: true,
                isActive: true,
                vehicle: {
                    type: "bike",
                    model: "Honda Shine",
                    plateNumber: "AP-02-DN-0001",
                    color: "Red",
                    year: 2023
                },
                location: {
                    latitude: 14.42,
                    longitude: 77.73,
                    lastUpdated: new Date()
                }
            },
            {
                name: "Kalam",
                email: "kalam@example.com",
                phone: "9823175702",
                password: "Password123!",
                isOnline: true,
                isActive: true,
                vehicle: {
                    type: "auto",
                    model: "Bajaj RE",
                    plateNumber: "AP-02-KL-0002",
                    color: "Yellow",
                    year: 2022
                },
                location: {
                    latitude: 14.40,
                    longitude: 77.71,
                    lastUpdated: new Date()
                }
            },
            {
                name: "Ansar",
                email: "ansar@example.com",
                phone: "9823175703",
                password: "Password123!",
                isOnline: true,
                isActive: true,
                vehicle: {
                    type: "car",
                    model: "Maruti Swift",
                    plateNumber: "AP-02-AN-0003",
                    color: "Silver",
                    year: 2021
                },
                location: {
                    latitude: 14.43,
                    longitude: 77.70,
                    lastUpdated: new Date()
                }
            }
        ];

        for (const data of driversData) {
            const exists = await Driver.findOne({ email: data.email });
            if (!exists) {
                await Driver.create(data);
                console.log(`✅ Created driver: ${data.name}`);
            } else {
                exists.isOnline = true;
                exists.location = data.location;
                await exists.save();
                console.log(`✅ Updated driver: ${data.name}`);
            }
        }

        // Fix Muzzu's location too
        const muzzu = await Driver.findOne({ email: "muzamil.tech.dept.dtc@gmail.com" });
        if (muzzu) {
            muzzu.location = {
                latitude: 14.415,
                longitude: 77.725,
                lastUpdated: new Date()
            };
            muzzu.isOnline = true;
            await muzzu.save();
            console.log('✅ Fixed Muzzu location');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
seed();

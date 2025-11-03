const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = 3000;

// Current UTC time and user from your system
const CURRENT_UTC = "2025-11-03 22:31:33";
const CURRENT_USER = "anyahritvik";
const DEFAULT_PROFILE_URL = "https://example.com/default-profile.png";

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

function sanitize(input) {
    return input.replace(/[^a-zA-Z0-9\-\.]/g, "");
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

function calculateExactAge(birthDateStr) {
    // Parse the birth date from DD-MM-YYYY format
    const [day, month, year] = birthDateStr.split('-');
    const birthDate = new Date(year, month - 1, day);
    const currentDate = new Date(CURRENT_UTC);
    
    let years = currentDate.getFullYear() - birthDate.getFullYear();
    let months = currentDate.getMonth() - birthDate.getMonth();

    if (months < 0 || (months === 0 && currentDate.getDate() < birthDate.getDate())) {
        years--;
        months += 12;
    }

    // Calculate total days
    const diffTime = Math.abs(currentDate - birthDate);
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return {
        years,
        months,
        days: totalDays,
        formatted: `${years} years, ${months} months (${totalDays} Days)`,
        exactDays: totalDays
    };
}

app.get('/api/profile/:uuid', async (req, res) => {
    const uuid = sanitize(req.params.uuid);
    const url = `https://world.secondlife.com/resident/${uuid}`;

    try {
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });

        const $ = cheerio.load(response.data);

        const profileData = {
            success: true,
            metadata: {
                fetchedAt: CURRENT_UTC,
                fetchedBy: CURRENT_USER,
                requestUrl: url
            },
            profile: {
                displayName: '',
                username: '',
                description: '',
                profileImage: '',
                uuid: uuid,
                birthInfo: 'Unknown',
                ageInfo: 'Unknown',
                ageDetails: null
            }
        };

        // Get profile image
        const imageElement = $('#content div.img img[class="parcelimg"]');
        profileData.profile.profileImage = imageElement.attr('src') || DEFAULT_PROFILE_URL;

        // Get display name
        const residentElement = $('.details h1.resident span').first();
        if (residentElement.length) {
            profileData.profile.displayName = residentElement.text().trim();
            const matches = profileData.profile.displayName.match(/\((.*?)\)/);
            if (matches && matches[1]) {
                profileData.profile.username = matches[1];
            }
        }

        // Get description
        const descElement = $('.details p.desc');
        if (descElement.length) {
            profileData.profile.description = descElement.text().trim();
        }

        // Extract Resident Since information
        const infoElement = $('.details p.info');
        if (infoElement.length) {
            const syscatSpan = infoElement.find('span.syscat');
            if (syscatSpan.text().trim() === 'Resident Since:') {
                let infoText = infoElement.contents()
                    .filter((_, el) => el.nodeType === 3)
                    .text()
                    .trim();

                const dateMatch = infoText.match(/(\d{4}-\d{2}-\d{2})/);
                if (dateMatch) {
                    const birthDate = dateMatch[1];
                    const [year, month, day] = birthDate.split('-');
                    const formattedBirthDate = `${day}-${month}-${year}`;
                    profileData.profile.birthInfo = formattedBirthDate;

                    // Calculate exact age with days
                    const calculatedAge = calculateExactAge(formattedBirthDate);
                    profileData.profile.ageInfo = calculatedAge.formatted;
                    
                    profileData.profile.ageDetails = {
                        exact: {
                            years: calculatedAge.years,
                            months: calculatedAge.months,
                            days: calculatedAge.days,
                            formatted: calculatedAge.formatted
                        },
                        birthDate: formattedBirthDate,
                        currentDate: formatDate(CURRENT_UTC.split(' ')[0]),
                        originalText: calculatedAge.formatted,
                        exactDays: calculatedAge.days
                    };
                }
            }
        }

        // Get profile links
        const detailsElement = $('.details #details');
        if (detailsElement.length) {
            profileData.profile.links = {
                webProfile: detailsElement.find('a.web_link').attr('href'),
                clientProfile: detailsElement.find('a.client_link').attr('href')
            };
        }

        profileData.version = "v1";
        res.json(profileData);

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message || "Failed to load profile",
            metadata: {
                timestamp: CURRENT_UTC,
                user: CURRENT_USER,
                errorType: err.name,
                url: url,
                errorStack: process.env.NODE_ENV === 'development' ? err.stack : undefined
            },
            version: "v1"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running: http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Current UTC: ${CURRENT_UTC}`);
    console.log(`Current User: ${CURRENT_USER}`);
});
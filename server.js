const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = 3000;

// Current UTC time and user from your system
const CURRENT_UTC = "2025-11-03 21:41:19";
const CURRENT_USER = "anyahritvik";

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
    const birthDate = new Date(birthDateStr);
    const currentDate = new Date(CURRENT_UTC);
    
    let years = currentDate.getFullYear() - birthDate.getFullYear();
    let months = currentDate.getMonth() - birthDate.getMonth();

    if (months < 0 || (months === 0 && currentDate.getDate() < birthDate.getDate())) {
        years--;
        months += 12;
    }

    return {
        years,
        months,
        formatted: `${years} years, ${months} months`
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
        const imageUrl = $('meta[property="og:image"]').attr('content') || 
                        $('#main-photo').attr('src') ||
                        $('img.profile_photo').attr('src');
        if (imageUrl) {
            profileData.profile.profileImage = imageUrl;
        }

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
                // Get the text content after the span
                let infoText = infoElement.contents()
                    .filter((_, el) => el.nodeType === 3) // Get text nodes only
                    .text()
                    .trim();
                
                // Extract the date and age parts
                const dateMatch = infoText.match(/(\d{4}-\d{2}-\d{2})/);
                let ageText = infoText.replace(/(\d{4}-\d{2}-\d{2})/, '').trim();
                
                // Remove parentheses and "ago"
                ageText = ageText.replace(/^\(|\)$|ago$/g, '').trim();

                if (dateMatch) {
                    const birthDate = dateMatch[1];
                    profileData.profile.birthInfo = formatDate(birthDate);
                    profileData.profile.ageInfo = ageText;

                    // Calculate exact age
                    const calculatedAge = calculateExactAge(birthDate);
                    
                    profileData.profile.ageDetails = {
                        exact: calculatedAge,
                        birthDate: formatDate(birthDate),
                        currentDate: formatDate(CURRENT_UTC.split(' ')[0]),
                        originalText: `${formatDate(birthDate)} (${calculatedAge.formatted})`
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
            }
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        metadata: {
            timestamp: CURRENT_UTC,
            user: CURRENT_USER,
            errorDetails: process.env.NODE_ENV === 'development' ? err : undefined
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running: http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Current UTC: ${CURRENT_UTC}`);
    console.log(`Current User: ${CURRENT_USER}`);
});
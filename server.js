const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));

function sanitize(input) {
    return input.replace(/[^a-zA-Z0-9\-\.]/g, "");
}

function calculateAge(birthDateStr) {
    const birthDate = new Date(birthDateStr);
    const currentDate = new Date();
    
    let years = currentDate.getFullYear() - birthDate.getFullYear();
    let months = currentDate.getMonth() - birthDate.getMonth();

    // Adjust years and months if current month is before birth month
    if (months < 0 || (months === 0 && currentDate.getDate() < birthDate.getDate())) {
        years--;
        months += 12;
    }

    // Handle edge case where day of month affects month calculation
    if (currentDate.getDate() < birthDate.getDate()) {
        months--;
        if (months < 0) {
            months = 11;
            years--;
        }
    }

    return {
        years,
        months,
        formatted: `${years} years, ${months} months`
    };
}

function parseResidentSince(text) {
    // Remove extra spaces and normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    // Extract date using regex - looking for YYYY-MM-DD format
    const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
    if (!dateMatch) return null;
    
    return dateMatch[1];
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

        // Profile Data Object
        const profileData = {
            success: true,
            profile: {
                displayName: '',
                description: '',
                imgSrc: '',
                uuid: uuid,
                birthInfo: 'Unknown',
                ageInfo: 'Unknown',
                residentSinceRaw: null,
                calculatedAge: null
            }
        };

        // Get basic profile information
        profileData.profile.displayName = $('.resident').text().trim() || 
                                        $('title').text().replace('Second Life » ', '').trim();
        
        profileData.profile.description = $('meta[name="description"]').attr('content');
        profileData.profile.imgSrc = $('meta[property="og:image"]').attr('content') || 
                                    $('#container-shadow-main img').attr('src') ||
                                    "https://example.com/default-profile.png";

        // Extract Resident Since information
        // Using the specific HTML structure from your screenshot
        const residentSinceElement = $('p.info').filter(function() {
            return $(this).find('span.syscat').text().trim() === 'Resident Since:';
        });

        if (residentSinceElement.length) {
            // Get the text content after the "Resident Since:" label
            const residentSinceText = residentSinceElement.text()
                .replace('Resident Since:', '')
                .trim();

            // Store raw data
            profileData.profile.residentSinceRaw = residentSinceText;

            // Parse the date
            const birthDate = parseResidentSince(residentSinceText);
            if (birthDate) {
                profileData.profile.birthInfo = birthDate;

                // Calculate current age
                const age = calculateAge(birthDate);
                profileData.profile.calculatedAge = age;
                profileData.profile.ageInfo = age.formatted;

                // Add additional age details
                profileData.profile.ageDetails = {
                    years: age.years,
                    months: age.months,
                    birthDate: birthDate,
                    currentDate: new Date().toISOString().split('T')[0]
                };
            }
        }

        // Get container details if available
        const containerDetails = $('#container-shadow-main').text().trim();
        if (containerDetails) {
            profileData.profile.containerDetails = containerDetails;
        }

        res.json(profileData);

    } catch (err) {
        res.json({
            success: false,
            error: err.message || "Failed to load profile",
            errorDetails: {
                timestamp: new Date().toISOString(),
                url: url,
                errorType: err.name,
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
        errorDetails: process.env.NODE_ENV === 'development' ? err : undefined
    });
});

app.listen(PORT, () => {
    console.log(`Server running: http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
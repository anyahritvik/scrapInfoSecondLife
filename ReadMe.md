## Fixed Profile Picture Loading, Age and Birthdate fetching....📅
# Second Life Profile Viewer

A web application to view Second Life resident profiles with detailed age calculations and profile information.

## Current Configuration
- Date/Time (UTC): 2025-11-03 22:42:56
- System User: anyahritvik

## Project Structure
```
scrapInfoSecondLife/
├── server.js         # Express server and profile data extraction
├── package.json      # Project dependencies
├── README.md         # This documentation
└── public/
    ├── index.html    # Frontend interface
    └── style.css     # Styling for the interface
```

## Prerequisites
- Node.js (version 14.0.0 or higher)
- npm (Node Package Manager)

## Installation

1. Clone or create the project directory:
```bash
mkdir your-project
cd your-project
```

2. Initialize the project:
```bash
npm init -y
```

3. Install required dependencies:
```bash
npm install express axios cheerio
```

4. Create the project structure:
```bash
mkdir public
```

5. Copy the provided files into their respective locations:
   - `server.js` in the root directory
   - `index.html` and `style.css` in the `public` directory

## Running the Application

1. Start the server:
```bash
node server.js
```

2. You should see the following console output:
```
Server running: http://localhost:3000
Environment: development
Current UTC: 2025-11-03 22:42:56
Current User: anyahritvik
```

3. Access the application:
   - Open your web browser
   - Navigate to `http://localhost:3000`

## Using the Application

1. Enter a Second Life UUID or username in the search box
2. Click "Fetch Profile" to retrieve the profile information
3. View the displayed information:
   - Profile picture
   - Display name and username
   - Birth date
   - Age (formatted as "X years, Y months (Z Days)")
   - Profile description
   - Profile links

## Features

- Profile Image Display
- Detailed Age Calculation
  - Years and months
  - Total days since registration
- Profile Information
  - Display name
  - Username
  - UUID
  - Birth date
  - Description
- Web and Client Profile Links
- Error Handling
- Responsive Design

## Error Handling

The application handles various error cases:
- Invalid UUID/username
- Network errors
- Missing profile information
- Failed image loading (uses default image)

## Data Format Example

For a resident registered on 11-12-2011, the age display would show:
```
Age: 13 years, 11 months (5075 Days)
```
## Screenshot Example
[![Image from Gyazo](https://i.gyazo.com/5c199a9cf78fd0933d432eae66af704b.png)](https://gyazo.com/5c199a9cf78fd0933d432eae66af704b)


## Troubleshooting

1. If the server won't start:
   - Check if port 3000 is available
   - Ensure all dependencies are installed
   - Verify Node.js version

2. If profile images don't load:
   - Check network connectivity
   - Verify the profile URL is accessible
   - Check browser console for errors

3. If age calculation seems incorrect:
   - Verify system time is correct
   - Check UTC time settings
   - Ensure date formats match expected format

## Contributing

When contributing to this project, please ensure:
1. Update the UTC time constant in server.js
2. Maintain the existing error handling
3. Test all profile data extraction
4. Verify age calculations


## Support

For issues or questions:
1. Check the error console in your browser
2. Verify your Node.js installation
3. Ensure all files are in their correct locations
4. Verify the current UTC time and user settings



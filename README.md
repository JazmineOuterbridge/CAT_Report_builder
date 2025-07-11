# CAT Report Builder - SharePoint Framework Web Part

A comprehensive SharePoint Framework (SPFx) web part for reinsurance catastrophe analysts to generate analysis reports from Moody's RiskModeler API data.

## Features

- **Dynamic Database Input**: Add multiple company and broker databases for current and previous years
- **Real-time Data Processing**: Fetch and aggregate data from Moody's RiskModeler API
- **Driving Peril Analysis**: Automatically identify and display the main driving peril
- **EP Curve Visualization**: Interactive charts showing exceedance probability curves
- **Excel Report Generation**: Download comprehensive reports with notes and data comparisons
- **Responsive Design**: Modern, mobile-friendly interface
- **SharePoint Integration**: Seamless integration with SharePoint Online

## Prerequisites

- Node.js 14.x or later
- SharePoint Online tenant
- Access to Moody's RiskModeler API
- SharePoint Framework development environment

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cat-report-builder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Trust the development certificate**
   ```bash
   gulp trust-dev-cert
   ```

4. **Build the project**
   ```bash
   gulp build
   ```

5. **Serve the web part**
   ```bash
   gulp serve
   ```

## Configuration

### API Configuration

1. **Moody's API Setup**
   - Configure Azure AD app registration for Moody's API access
   - Set up API credentials in Azure Key Vault
   - Update API endpoint in web part properties

2. **SharePoint Configuration**
   - Deploy the web part to your SharePoint tenant
   - Configure web part properties in SharePoint

### Web Part Properties

- **API Endpoint**: Moody's RiskModeler API base URL
- **API Version**: API version (default: v6)

## Usage

### Input Database Names

1. **Company Databases**
   - **Current Year**: Enter one or more database names (required)
   - **Previous Year**: Enter database names for comparison (optional)

2. **Broker Databases**
   - **Current Year**: Enter broker database names (optional)
   - **Previous Year**: Enter previous year broker databases (optional)

3. **Add Multiple Databases**
   - Click "Add Another Database" to add additional input fields
   - Remove databases using the "×" button

### Analysis Process

1. **Submit Data**: Click "Submit" to fetch data from Moody's API
2. **View Results**: 
   - Driving peril identification
   - EP curve visualization
   - AAL and TIV comparisons
   - Percentage change calculations
3. **Download Report**: Click "Download Excel Report" to generate the Excel file

### Excel Report Structure

**Sheet 1: Notes**
- Main driving peril identification
- AAL percentage change analysis
- Exposure change analysis
- Database information and versions
- Reinsurance details
- Broker comparison notes

**Sheet 2: Data Comparison**
- Peril-specific data tables
- Company vs. Previous Year comparisons
- Company vs. Broker comparisons
- Percentage change calculations

## API Integration

### Moody's RiskModeler API

The web part integrates with Moody's RiskModeler API to fetch:

- **Peril Data**: EP curves, AAL, TIV for each peril
- **Database Metadata**: Version information and metadata
- **Reinsurance Details**: Quota share and reinsurance information

### Authentication

- Uses SharePoint's Azure AD authentication
- Secure token handling for API calls
- Automatic token refresh

## Development

### Project Structure

```
src/
├── webparts/
│   └── catReportBuilder/
│       ├── components/
│       │   ├── CatReportBuilder.tsx
│       │   ├── DatabaseInput.tsx
│       │   ├── ResultsDisplay.tsx
│       │   ├── EPCurveChart.tsx
│       │   └── ExcelGenerator.tsx
│       ├── CatReportBuilderWebPart.ts
│       └── CatReportBuilderWebPart.manifest.json
├── services/
│   └── RiskModelerApiService.ts
└── models/
    └── IAnalysisResults.ts
```

### Key Components

- **CatReportBuilder**: Main component orchestrating the entire workflow
- **DatabaseInput**: Dynamic input fields for database names
- **ResultsDisplay**: Results visualization and download functionality
- **EPCurveChart**: Chart.js integration for EP curve visualization
- **ExcelGenerator**: Client-side Excel file generation
- **RiskModelerApiService**: API integration and data processing

### Styling

- Uses SharePoint Fabric UI components
- Responsive CSS modules
- Modern, professional design
- Mobile-friendly interface

## Deployment

### Package for Production

```bash
gulp bundle --ship
gulp package-solution --ship
```

### Deploy to SharePoint

1. Upload the `.sppkg` file to your SharePoint App Catalog
2. Add the web part to your SharePoint pages
3. Configure web part properties

## Troubleshooting

### Common Issues

1. **API Authentication Errors**
   - Verify Azure AD app registration
   - Check API credentials in Key Vault
   - Ensure proper permissions

2. **Build Errors**
   - Clear node_modules and reinstall
   - Update Node.js version
   - Check TypeScript configuration

3. **Excel Download Issues**
   - Verify browser compatibility
   - Check file size limits
   - Ensure proper permissions

### Debug Mode

```bash
gulp serve --nobrowser
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check SharePoint Framework documentation

## Version History

- **v1.0.0**: Initial release with basic functionality
- Future versions will include additional features and improvements 
# Plotly Artifact Usage Guide

## Overview
The artifact system now supports Plotly visualizations with the `plotly` format type. This allows for interactive charts and graphs to be displayed within the chat interface.

## Data Format
When creating a Plotly artifact, the `data` field should contain a JSON string with the following structure:

```json
{
  "data": [
    {
      // Plotly trace objects
      "x": [...],
      "y": [...],
      "type": "scatter",
      "mode": "lines+markers",
      "name": "Series Name"
    }
  ],
  "layout": {
    // Plotly layout configuration
    "title": "Chart Title",
    "xaxis": { "title": "X Axis" },
    "yaxis": { "title": "Y Axis" }
  },
  "config": {
    // Optional Plotly config
    "displayModeBar": true,
    "responsive": true
  }
}
```

## Example Usage

### 1. Line Chart
```javascript
const lineChartData = {
  data: [{
    x: [1, 2, 3, 4, 5],
    y: [2, 4, 3, 5, 6],
    type: 'scatter',
    mode: 'lines+markers',
    name: 'Data Series'
  }],
  layout: {
    title: 'Simple Line Chart',
    xaxis: { title: 'X Values' },
    yaxis: { title: 'Y Values' }
  }
};
```

### 2. Bar Chart
```javascript
const barChartData = {
  data: [{
    x: ['Product A', 'Product B', 'Product C'],
    y: [20, 14, 23],
    type: 'bar'
  }],
  layout: {
    title: 'Product Sales'
  }
};
```

### 3. Pie Chart
```javascript
const pieChartData = {
  data: [{
    values: [19, 26, 55],
    labels: ['Residential', 'Non-Residential', 'Utility'],
    type: 'pie'
  }],
  layout: {
    title: 'Market Share'
  }
};
```

## WebSocket Event Format
When sending a Plotly artifact through WebSocket:

```json
{
  "event_type": "artifact_create_success",
  "artifact_id": "unique-id",
  "name": "Chart Title",
  "description": "Chart description",
  "format_type": "plotly",
  "data": "{\"data\": [...], \"layout\": {...}}",
  "timestamp": "2025-07-04T12:00:00Z"
}
```

## Features
- **Interactive Charts**: Users can zoom, pan, and hover over data points
- **Responsive Design**: Charts automatically resize to fit their container
- **Dark Mode Support**: Charts adapt to the current theme
- **Export Options**: Users can download charts as PNG images
- **CDN Loading**: Plotly.js is loaded from CDN on demand

## Testing
Use the provided test functions in the browser console:
```javascript
// Import and run the test function
simulatePlotlyArtifactEvent()
```

This will create a sample Plotly chart artifact in the chat interface.
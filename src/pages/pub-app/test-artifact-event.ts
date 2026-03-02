// Test function to simulate artifact creation
// This can be used to test the artifact display functionality

export function simulateArtifactEvent() {
  const artifactEvent = new CustomEvent('artifact_event', {
    detail: {
      timestamp: new Date().toISOString(),
      event_type: 'artifact_create_success',
      run_id: '75e4da1f-d843-439a-8037-331ca46ec173',
      user_id: 'test',
      session_id: '67e5671cc585dd586126cc57-n9mlwycpm9',
      artifact_id: '1b9f2778-51bb-42b9-bca4-7b646849f721',
      name: 'Order Confirmation and Delivery Schedule',
      description: 'Contains the details of the order for iPhone 14 placed by Shreyas, including shipping address, payment status, and delivery schedule.',
      format_type: 'markdown',
      data: `# Order Confirmation Report

## Customer Information
- **Customer Name:** Shreyas
- **Shipping Address:** 155 2nd Street, NJ

## Order Details
- **Product Name:** Apple iPhone 14
- **Product ID:** IP14-2025
- **Quantity:** 1

## Payment Status
✅ **Confirmed**

## Delivery Schedule for Order#1001
- **Route:** Main Warehouse → Regional Hub → Customer (155 2nd Street, NJ)
- **Estimated Delivery Date:** 2025-03-22
- **Tracking Number:** TRK1001XYZ

---

Thank you for your order, Shreyas! 🎉`,
      metadata: null,
      trace_id: '58d55105-e4bf-4179-b4b1-057ab635b887',
      log_id: 'b3eff6f2-55cd-4f1f-9273-f92b4ad9fc47'
    }
  });
  
  window.dispatchEvent(artifactEvent);
  
  console.log('Artifact event dispatched!');
}

// You can call this function from the browser console to test:
// simulateArtifactEvent()

export function simulatePlotlyArtifactEvent() {
  const plotlyData = {
    data: [
      {
        x: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        y: [20, 14, 23, 25, 22],
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Sales',
        line: { color: '#3b82f6' }
      },
      {
        x: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        y: [16, 18, 17, 19, 20],
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Costs',
        line: { color: '#ef4444' }
      }
    ],
    layout: {
      title: 'Monthly Sales vs Costs',
      xaxis: { title: 'Month' },
      yaxis: { title: 'Amount ($k)' },
      hovermode: 'closest'
    }
  };

  const artifactEvent = new CustomEvent('artifact_event', {
    detail: {
      timestamp: new Date().toISOString(),
      event_type: 'artifact_create_success',
      run_id: '75e4da1f-d843-439a-8037-331ca46ec174',
      user_id: 'test',
      session_id: '67e5671cc585dd586126cc57-n9mlwycpm9',
      artifact_id: '2b9f2778-51bb-42b9-bca4-7b646849f722',
      name: 'Sales Performance Chart',
      description: 'Interactive chart showing monthly sales and costs comparison',
      format_type: 'plotly',
      data: JSON.stringify(plotlyData),
      metadata: null,
      trace_id: '58d55105-e4bf-4179-b4b1-057ab635b888',
      log_id: 'b3eff6f2-55cd-4f1f-9273-f92b4ad9fc48'
    }
  });
  
  window.dispatchEvent(artifactEvent);
  
  console.log('Plotly artifact event dispatched!');
}

// You can call this function from the browser console to test:
// simulatePlotlyArtifactEvent()
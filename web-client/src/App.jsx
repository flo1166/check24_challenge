import React from 'react'
import './styles/App.css'
import WidgetRenderer from './components/WidgetRenderer'

// Remove this - mock server data
// TODO: Replace with actual API call in a real application
const mockServerData = [
  {
    widget_id: 'w-card-001',
    component_type: 'Card',
    data: {
      content: {
        title: 'Welcome to SDUI PoC',
        body: 'This Card widget was rendered entirely based on the component_type and data provided in this JSON object.',
      },
    },
    priority: 1,
  },
  {
    widget_id: 'w-missing-002',
    component_type: 'UnknownComponent', // This will test your error handling in WidgetRenderer
    data: {
      content: {
        message: 'This widget type does not exist on the client.',
      },
    },
    priority: 2,
  },
];
// REMOVE THIS

const App = () => {
  // In a real application, you would use useState and useEffect here to fetch data:
  // const [widgets, setWidgets] = useState([]);
  // useEffect(() => { /* fetch logic */ }, []);

  // For the PoC, we just use the mock data directly.
  const pageWidgets = mockServerData;
  const pageTitle = "Server-Driven Home Page";

  return (
    <div className="app-container">
      <h1>{pageTitle}</h1>
      <p>
        Source: The layout and content below are determined by the
        mockServerData structure in `App.jsx`, mimicking a live API response.
      </p>

      {/* 2. Iterate and Render Widgets */}
      {pageWidgets.map((widget) => (
        <WidgetRenderer key={widget.widget_id} widget={widget} />
      ))}
    </div>
  );
};

export default App;
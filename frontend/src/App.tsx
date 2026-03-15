import React from "react";
import { MapContainer } from "./components/Map/MapContainer";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { FilterPanel } from "./components/Filters/FilterPanel";
import { Header } from "./components/UI/Header";
import { Legend } from "./components/UI/Legend";
import { useMapStore } from "./store/mapStore";

const App: React.FC = () => {
  const { sidebarOpen } = useMapStore();

  return (
    <div className="app-shell">
      <Header />
      <div className="app-body">
        {/* Left Filter Panel */}
        <FilterPanel />

        {/* Main Map + Sidebar overlay */}
        <main className="map-area">
          <MapContainer />
          <Legend />
          {sidebarOpen && <Sidebar />}
        </main>
      </div>
    </div>
  );
};

export default App;

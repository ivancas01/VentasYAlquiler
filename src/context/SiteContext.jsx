import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const SiteContext = createContext();

export const SiteProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/config/');
      const data = Array.isArray(res.data) ? res.data[0] : res.data;
      if (data && data.id) {
        setConfig(data);
        applyTheme(data);
      }
    } catch (err) {
      console.error("Error fetching site config", err);
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (cfg) => {
    if (!cfg) return;
    document.body.className = '';
    document.body.classList.add(`theme-${cfg.theme || 'noir'}`);
    document.body.classList.add(`font-${cfg.typography || 'modern'}`);
  };

  const updateConfig = (newConfig) => {
    setConfig(newConfig);
    applyTheme(newConfig);
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <SiteContext.Provider value={{ config, loading, refreshConfig: fetchConfig, updateConfig }}>
      {children}
    </SiteContext.Provider>
  );
};

export const useSite = () => useContext(SiteContext);

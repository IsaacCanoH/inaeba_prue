import React, { createContext, useState, useContext } from 'react';
import Loader from '../components/Loader/Loader';

const LoaderContext = createContext();

export const LoaderProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const showLoader = (msg = "") => {
    setMessage(msg);
    setLoading(true);
  };

  const hideLoader = () => {
    setLoading(false);
    setMessage("");
  };

  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader }}>
      {loading && <Loader message={message} />}
      {children}
    </LoaderContext.Provider>
  );
};

export const useLoader = () => useContext(LoaderContext);

// export const useLoader = () => {
//   const ctx = useContext(LoaderContext);
//   console.log("Loader context:", ctx);
//   return ctx;
// };

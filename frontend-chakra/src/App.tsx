import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import theme from './theme';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import PricingPage from './pages/PricingPage';
import OffersPage from './pages/OffersPage';
import ContractPage from './pages/ContractPage';
import SuccessPage from './pages/SuccessPage';
import OpsDashboard from './pages/OpsDashboard';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/contract" element={<ContractPage />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/ops" element={<OpsDashboard />} />
          </Routes>
        </Layout>
      </Router>
    </ChakraProvider>
  );
}

export default App;
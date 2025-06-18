// Test script for Finnhub API integration
import { searchAssets, getAssetDetails } from './services/financialApi';
import { FINNHUB_API_KEY } from './config/financialApi';

// Log the API key (first few characters only)
console.log(`Using Finnhub API key: ${FINNHUB_API_KEY.substring(0, 3)}...`);

// Test search function
const testSearch = async () => {
  console.log('Testing search function...');
  try {
    const results = await searchAssets('AAPL');
    console.log('Search results:', results);
  } catch (error) {
    console.error('Search error:', error);
  }
};

// Test get asset details function
const testGetAssetDetails = async () => {
  console.log('Testing getAssetDetails function...');
  try {
    const asset = await getAssetDetails('AAPL');
    console.log('Asset details:', asset);
  } catch (error) {
    console.error('Get asset details error:', error);
  }
};

// Run tests
const runTests = async () => {
  await testSearch();
  await testGetAssetDetails();
  console.log('All tests completed.');
};

// Execute tests
runTests(); 
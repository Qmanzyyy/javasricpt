const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedApiKey = 'PaniisApiKeyNesakti2026'; // Hardcoded

  console.log('Received API Key:', apiKey);
  console.log('Expected API Key:', expectedApiKey);

  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key is required'
    });
  }

  if (apiKey !== expectedApiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key'
    });
  }

  next();
};

module.exports = { validateApiKey };

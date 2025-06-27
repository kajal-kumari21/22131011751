import { BarChart3, Clock, Copy, ExternalLink, Eye, Link, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';


const logger = {
  info: (message, data = {}) => {
    const timestamp = new Date().toISOString();
    console.log(`[INFO] ${timestamp}: ${message}`, data);
  },
  warn: (message, data = {}) => {
    const timestamp = new Date().toISOString();
    console.warn(`[WARN] ${timestamp}: ${message}`, data);
  },
  error: (message, data = {}) => {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR] ${timestamp}: ${message}`, data);
  }
};

const URLShortener = () => {
  const [urls, setUrls] = useState([]);
  const [originalUrl, setOriginalUrl] = useState('');
  const [customShortcode, setCustomShortcode] = useState('');
  const [validityPeriod, setValidityPeriod] = useState(30);
  const [activeTab, setActiveTab] = useState('shorten');
  const [copiedId, setCopiedId] = useState(null);

 
  const generateShortcode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

 
  const isShortcodeUnique = (shortcode) => {
    return !urls.find(url => url.shortcode === shortcode);
  };


  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };


  const createShortUrl = () => {
    logger.info('Attempting to create short URL', { originalUrl, customShortcode, validityPeriod });

    if (!originalUrl.trim()) {
      logger.warn('URL creation failed - empty URL');
      alert('Please enter a URL');
      return;
    }

    if (!isValidUrl(originalUrl)) {
      logger.warn('URL creation failed - invalid URL format', { originalUrl });
      alert('Please enter a valid URL');
      return;
    }

    let shortcode = customShortcode.trim();
    
    if (shortcode) {
     
      if (shortcode.length < 3 || shortcode.length > 20) {
        logger.warn('Custom shortcode validation failed - invalid length', { shortcode });
        alert('Custom shortcode must be between 3-20 characters');
        return;
      }
      
      if (!/^[a-zA-Z0-9]+$/.test(shortcode)) {
        logger.warn('Custom shortcode validation failed - invalid characters', { shortcode });
        alert('Custom shortcode can only contain letters and numbers');
        return;
      }

      if (!isShortcodeUnique(shortcode)) {
        logger.warn('Custom shortcode validation failed - not unique', { shortcode });
        alert('This shortcode is already taken. Please choose another one.');
        return;
      }
    } else {
     
      do {
        shortcode = generateShortcode();
      } while (!isShortcodeUnique(shortcode));
    }

    const newUrl = {
      id: Date.now(),
      originalUrl: originalUrl.trim(),
      shortcode,
      shortUrl: `https://short.ly/${shortcode}`,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + validityPeriod * 60 * 1000),
      clicks: 0,
      clickHistory: []
    };

    setUrls(prev => [newUrl, ...prev]);
    setOriginalUrl('');
    setCustomShortcode('');
    setValidityPeriod(30);

    logger.info('Short URL created successfully', { 
      shortcode, 
      originalUrl: newUrl.originalUrl,
      expiresAt: newUrl.expiresAt 
    });
  };

 
  const handleUrlClick = (url) => {
    const now = new Date();
    
    if (now > url.expiresAt) {
      logger.warn('URL access attempt failed - expired', { shortcode: url.shortcode });
      alert('This shortened URL has expired');
      return;
    }

    const clickData = {
      timestamp: now,
      userAgent: navigator.userAgent,
      referrer: document.referrer || 'Direct'
    };

    setUrls(prev => prev.map(u => 
      u.id === url.id 
        ? { 
            ...u, 
            clicks: u.clicks + 1,
            clickHistory: [...u.clickHistory, clickData]
          }
        : u
    ));

    logger.info('URL clicked', { 
      shortcode: url.shortcode, 
      totalClicks: url.clicks + 1,
      originalUrl: url.originalUrl 
    });

   
    window.open(url.originalUrl, '_blank');
  };

 
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      logger.info('URL copied to clipboard', { shortUrl: text });
    }).catch(err => {
      logger.error('Failed to copy URL to clipboard', { error: err.message });
    });
  };

 
  const deleteUrl = (id) => {
    const urlToDelete = urls.find(u => u.id === id);
    setUrls(prev => prev.filter(u => u.id !== id));
    logger.info('URL deleted', { shortcode: urlToDelete?.shortcode });
  };


  useEffect(() => {
    const checkExpiredUrls = () => {
      const now = new Date();
      const expiredUrls = urls.filter(url => now > url.expiresAt);
      if (expiredUrls.length > 0) {
        logger.info('Expired URLs detected', { count: expiredUrls.length });
      }
    };

    const interval = setInterval(checkExpiredUrls, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [urls]);

  const totalUrls = urls.length;
  const totalClicks = urls.reduce((sum, url) => sum + url.clicks, 0);
  const activeUrls = urls.filter(url => new Date() <= url.expiresAt).length;
  const expiredUrls = totalUrls - activeUrls;

 
  const topUrls = [...urls]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5);

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const isExpired = (url) => new Date() > url.expiresAt;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Link className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">URL Shortener</h1>
          </div>
          <p className="text-gray-600 text-lg">Create short, memorable links with detailed analytics</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-md">
            <button
              onClick={() => setActiveTab('shorten')}
              className={`px-6 py-2 rounded-md transition-all ${
                activeTab === 'shorten'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Shorten URL
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-6 py-2 rounded-md transition-all ${
                activeTab === 'manage'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Manage & Analytics
            </button>
          </div>
        </div>

        {activeTab === 'shorten' && (
          <div className="max-w-2xl mx-auto">
            {/* URL Shortening Form */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800">Create Short URL</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original URL *
                  </label>
                  <input
                    type="url"
                    value={originalUrl}
                    onChange={(e) => setOriginalUrl(e.target.value)}
                    placeholder="https://example.com/very-long-url"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Shortcode (Optional)
                    </label>
                    <input
                      type="text"
                      value={customShortcode}
                      onChange={(e) => setCustomShortcode(e.target.value)}
                      placeholder="my-custom-code"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">3-20 characters, letters and numbers only</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Validity Period (Minutes)
                    </label>
                    <input
                      type="number"
                      value={validityPeriod}
                      onChange={(e) => setValidityPeriod(parseInt(e.target.value) || 30)}
                      min="1"
                      max="525600"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  onClick={createShortUrl}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create Short URL
                </button>
              </div>
            </div>

            {/* Recent URLs */}
            {urls.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Recent URLs</h3>
                <div className="space-y-4">
                  {urls.slice(0, 3).map((url) => (
                    <div key={url.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-600 truncate">{url.originalUrl}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-blue-600 font-medium">{url.shortUrl}</span>
                            <button
                              onClick={() => copyToClipboard(url.shortUrl, url.id)}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            {copiedId === url.id && (
                              <span className="text-green-600 text-sm">Copied!</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">{url.clicks} clicks</span>
                          <button
                            onClick={() => handleUrlClick(url)}
                            disabled={isExpired(url)}
                            className={`p-2 rounded-lg transition-colors ${
                              isExpired(url)
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Created: {formatDate(url.createdAt)}</span>
                        <span className={isExpired(url) ? 'text-red-500' : ''}>
                          {isExpired(url) ? 'Expired' : `Expires: ${formatDate(url.expiresAt)}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="max-w-6xl mx-auto">
            {/* Analytics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total URLs</p>
                    <p className="text-3xl font-bold text-blue-600">{totalUrls}</p>
                  </div>
                  <Link className="w-12 h-12 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Clicks</p>
                    <p className="text-3xl font-bold text-green-600">{totalClicks}</p>
                  </div>
                  <Eye className="w-12 h-12 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active URLs</p>
                    <p className="text-3xl font-bold text-blue-600">{activeUrls}</p>
                  </div>
                  <BarChart3 className="w-12 h-12 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Expired URLs</p>
                    <p className="text-3xl font-bold text-red-600">{expiredUrls}</p>
                  </div>
                  <Clock className="w-12 h-12 text-red-600" />
                </div>
              </div>
            </div>

            {/* Top Performing URLs */}
            {topUrls.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                <h3 className="text-xl font-semibold mb-6 text-gray-800">Top Performing URLs</h3>
                <div className="space-y-4">
                  {topUrls.map((url, index) => (
                    <div key={url.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-600 truncate">{url.originalUrl}</p>
                          <p className="text-blue-600 font-medium">{url.shortUrl}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-800">{url.clicks}</p>
                          <p className="text-sm text-gray-500">clicks</p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          isExpired(url) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {isExpired(url) ? 'Expired' : 'Active'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All URLs Management */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-semibold mb-6 text-gray-800">All URLs</h3>
              {urls.length === 0 ? (
                <div className="text-center py-12">
                  <Link className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No URLs created yet</p>
                  <button
                    onClick={() => setActiveTab('shorten')}
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Your First URL
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {urls.map((url) => (
                    <div key={url.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-600 mb-1">Original URL:</p>
                          <p className="text-gray-800 break-all mb-2">{url.originalUrl}</p>
                          <div className="flex items-center space-x-2 mb-2">
                            <p className="text-blue-600 font-medium">{url.shortUrl}</p>
                            <button
                              onClick={() => copyToClipboard(url.shortUrl, url.id)}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            {copiedId === url.id && (
                              <span className="text-green-600 text-sm">Copied!</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUrlClick(url)}
                            disabled={isExpired(url)}
                            className={`p-2 rounded-lg transition-colors ${
                              isExpired(url)
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-blue-600 hover:bg-blue-50'
                            }`}
                            title="Open URL"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteUrl(url.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete URL"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Clicks</p>
                          <p className="font-semibold text-green-600">{url.clicks}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Created</p>
                          <p className="font-medium">{formatDate(url.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Expires</p>
                          <p className={`font-medium ${isExpired(url) ? 'text-red-600' : 'text-gray-800'}`}>
                            {formatDate(url.expiresAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Status</p>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            isExpired(url) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {isExpired(url) ? 'Expired' : 'Active'}
                          </span>
                        </div>
                      </div>

                      {url.clickHistory.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-600 mb-2">Recent Activity:</p>
                          <div className="space-y-1">
                            {url.clickHistory.slice(-3).reverse().map((click, index) => (
                              <div key={index} className="flex items-center justify-between text-xs text-gray-500">
                                <span>{formatDate(click.timestamp)}</span>
                                <span>{click.referrer}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default URLShortener;
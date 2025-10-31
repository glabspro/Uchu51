
const CACHE_NAME = 'uchu51-cache-v2';
// This list should include all the essential files for your app to work offline.
const URLS_TO_CACHE = [
  '/',
  'index.html',
  'index.tsx',
  'App.tsx',
  'types.ts',
  'constants.ts',
  'components/Header.tsx',
  'components/OrderCard.tsx',
  'components/WaitingBoard.tsx',
  'components/KitchenBoard.tsx',
  'components/DeliveryBoard.tsx',
  'components/LocalBoard.tsx',
  'components/Dashboard.tsx',
  'components/icons.tsx',
  'components/RetiroBoard.tsx',
  'components/CustomerView.tsx',
  'components/Login.tsx',
  'components/Toast.tsx',
  'components/POSView.tsx',
  'components/CajaView.tsx',
  'components/SauceModal.tsx',
  'components/PaymentModal.tsx',
  'components/ReceiptModal.tsx',
  'components/PreBillModal.tsx',
  'components/Logo.tsx',
  'components/DeliveryPaymentModal.tsx',
  'components/CloseCajaModal.tsx',
  'components/SalesHistoryModal.tsx',
  'icon-192x192.png',
  'icon-512x512.png'
];

// Install event: cache the application shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event: serve cached content when offline (cache-first strategy)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache - fetch from network, cache, and return
        return fetch(event.request).then(
          response => {
            // Check if we received a valid response. We don't cache non-200 responses or opaque responses for third-party assets.
            if (!response || response.status !== 200 || response.type === 'opaque') {
              return response;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(err => {
            // Network request failed, and it's not in the cache.
            // This is where you might want to return a fallback offline page if you had one.
            console.error('Fetch failed; returning offline page instead.', err);
        });
      })
  );
});
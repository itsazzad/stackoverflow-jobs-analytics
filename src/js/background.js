'use strict';

chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
});

chrome.tabs.onUpdated.addListener(tabId => {
  chrome.pageAction.show(tabId);
});

console.log('SOJobs Event Page for Page Action');

// // Where we will expose all the data we retrieve from storage.sync.
// const storageCache = {};
// // Asynchronously retrieve data from storage.sync, then cache it.
// const initStorageCache = getAllStorageSyncData().then(items => {
//   // Copy the data retrieved from storage into storageCache.
//   Object.assign(storageCache, items);
// });

// chrome.browserAction.onClicked.addListener(async (tab) => {
//   try {
//     await initStorageCache;
//     console.log(storageCache);
//   } catch (e) {
//     // Handle error that occurred during storage initialization.
//   }
//   // Normal action handler logic.
// });

// // Reads all data out of storage.sync and exposes it via a promise.
// //
// // Note: Once the Storage API gains promise support, this function
// // can be greatly simplified.
// function getAllStorageSyncData() {
//   // Immediately return a promise and start asynchronous work
//   return new Promise((resolve, reject) => {
//     // Asynchronously fetch all data from storage.sync.
//     chrome.storage.local.get(null, (items) => {
//       // Pass any observed errors down the promise chain.
//       if (chrome.runtime.lastError) {
//         return reject(chrome.runtime.lastError);
//       }
//       // Pass the data retrieved from storage down the promise chain.
//       resolve(items);
//     });
//   });
// }

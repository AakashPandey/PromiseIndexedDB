var connectDB = (dbDef, resolve, reject) => {
    return new Promise((resolve, reject) => {
        // Opens a connection to the existing database or creates a new one    
        req = window.indexedDB.open(dbDef.dbName, dbDef.dbVer);
        req.onsuccess = (ev) => {
            // Saves an instance of the connection to our custom object        
            dbDef.dbCon = ev.target.result;
            resolve();
        }
        req.onupgradeneeded = (event) => {
            // Only fired once per db version, used to initiliaze the db
            dbDef.dbCon = event.target.result;
            dbDef.dbInit = 1;
            resolve();
        }
        req.onerror = (e) => {
            // Returns error event
            reject(e);
        }
    });
}

var createDB = (dbDef, dbInit) => {
    return new Promise((resolve, reject) => {
        if (!dbDef.dbInit) {
            resolve(`[createDB] ${dbDef.dbName}, already initialized`)
        }
        var objectStore = dbDef.dbCon.createObjectStore(dbDef.dbStore, { keyPath: dbDef.dbKeyp });
        // HERE
        if (dbDef.dbIndex) {
            dbDef.dbIndex.map(dx => {
                // Create indexes dynamically based on dbDef
                objectStore.createIndex(dx.name, dx.key, { unique: dx.pri });
            });
        }
        objectStore.transaction.oncomplete = (e) => {
            trx = dbDef.dbCon.transaction(dbDef.dbStore, "readwrite").objectStore(dbDef.dbStore);
            dbInit.map(row => trx.add(row));
            resolve(`[createDB] ${dbDef.dbName}, task finished`);
        }
        objectStore.transaction.onerror = (event) => {
            reject(`[createDB] ${dbDef.dbName}, ${event.request.errorCode}`);
        };
    });
}

var readDB = (dbDef, key, dex) => {
    return new Promise((resolve, reject) => {
        var trx = dbDef.dbCon.transaction([dbDef.dbStore]).objectStore(dbDef.dbStore);
        // If reading by an index
        if (dex) {
            // request index lookup
            trx = trx.index(dex);
            trx.get(key).onsuccess = (r) => {
                if (r.target.result !== undefined) {
                    resolve(r.target.result);
                } else {
                    resolve(`[readDB] ${dbDef.dbStore}, key: ${key} not found (${dex})`)
                }
            }
        }
        trx = trx.get(key);
        trx.onsuccess = (r) => {
            if (r.target.result === undefined) {
                reject(`[readDB] ${dbDef.dbStore}, key: ${key} not found`);
            } else {
                resolve(r.target.result);
            }
        }
        trx.onerror = (e) => {
            reject(e);
        }
    });
}

var appendDB = (dbDef, newData) => {
    return new Promise((resolve, reject) => {
        // Request a transaction with readwrite
        var trx = dbDef.dbCon.transaction([dbDef.dbStore], "readwrite").objectStore(dbDef.dbStore);
        // Append new objects to store by mapping over the newData array of objects
        newData.map(row => trx.add(row));
        resolve(`[appendDB] -> ${dbDef.dbStore}, Task finished`);
        trx.onerror = (e) => {
            reject(e);
        }
    });
};

var updateDB = (dbDef, key, newData) => {
    return new Promise((resolve, reject) => {
        var trx = dbDef.dbCon.transaction([dbDef.dbStore], "readwrite").objectStore(dbDef.dbStore);
        // Attempt to fetch the object row based on key
        req = trx.get(key);
        req.onsuccess = (r) => {
            // resolve(r.target.result);
            if (r.target.result !== undefined) {
                // assign a reference of fetched row to data 
                data = r.target.result;
                // Iterate over the keys of newData
                Array.from(Object.keys(newData)).map((i) => {
                    // Update with new data values
                    data[i] = newData[i];
                });
                // Write the changes back to store
                var upd = trx.put(data);
                upd.onsuccess = (e) => {
                    resolve(`[updateDB] ${dbDef.dbName}, updated ${key} `);
                }
            } else {
                resolve(`[updateDB] ${dbDef.dbStore}, key: ${key} not found`);
            }
        }; trx.onerror = (e) => {
            reject(e);
        }
    });
}
var delDB = (dbDef, key) => {
    return new Promise((resolve, reject) => {
        var trx = dbDef.dbCon.transaction([dbDef.dbStore], "readwrite").objectStore(dbDef.dbStore);
        req = trx.delete(key);
        console.log(`[delDB] ${dbDef.dbName}, attempted to delete ${key} `);
        // Delete operation returns no confirmation
        req.onsuccess = () => {
            resolve();
        }
        trx.onerror = (e) => {
            reject(e);
        }
    });
}


const initData = [
    {},
    {}
];

var dbDef = {
    dbName: "",
    dbVer: 1,
    dbStore: "",
    dbKeyp: "",
    dbIndex: [
        { name: "by_", key: "", pri: true },
        { name: "by_", key: "", pri: false }
    ]
};

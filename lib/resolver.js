'use strict'

const githubTree = "https://api.github.com/repos/Path-Check/paper-cred/git/trees";

var localPubKeyDB = {};
var localPayloadsDB = [];
var localPayloadsSpecFiles = {};

async function getTXT(url) {
    let client = new XMLHttpRequest();
    client.open('GET', url, false);
    client.setRequestHeader("Accept", "application/vnd.github.v3+json");
    client.send();
    return client.response;
}

async function getJSON(url) {
    return JSON.parse(await getTXT(url));
}

async function getGitHubDatabase(id, database) {
    try {
        const rootDir = await getJSON(await githubTree + "/" + "main").tree
        const databasesDir = rootDir.find(element => element.path === 'keys');

        if (databasesDir === undefined) {
            console.debug("Keys Directory not Found on GitHub");
            return;
        }

        const databases = await getJSON(await githubTree+"/"+databasesDir.sha).tree
        const databaseDir = databases.find(element => element.path === database);

        if (databaseDir === undefined) {
            console.debug("Database not found on GitHub " + database);
            return;
        } 
        
        const idsFiles = await getJSON(await githubTree+"/"+databaseDir.sha).tree
        const idFile = idsFiles.find(element => element.path === id+'.pem');

        if (idFile === undefined) {
            console.debug("Id not found on GitHub " + id);
            return;
        }

        const publicKeyPem = atob(await getJSON(idFile.url).content)

        return publicKeyPem;
    } catch(err) {
        console.error(err);
    }
}

async function getKeyId(pubkeyURL) {
    // Download pubkey to verify
    if (localPubKeyDB[pubkeyURL]) {
        return localPubKeyDB[pubkeyURL];
    }
        
    try {
        // Try to download from the DNS TXT record. 
        const jsonResponse = await getJSON("https://dns.google/resolve?name=" + pubkeyURL + '&type=TXT');
        if (jsonResponse.Answer) {
            const pubKeyTxtLookup = jsonResponse.Answer[0].data
            let noQuotes = pubKeyTxtLookup.substring(1, pubKeyTxtLookup.length - 1).replace(/\\n/g,"\n");
                
            if (noQuotes) {  
                if (!noQuotes.includes("-----BEGIN PUBLIC KEY-----")) {
                    noQuotes = "-----BEGIN PUBLIC KEY-----" + "\n" + noQuotes + "\n" + "-----END PUBLIC KEY-----\n"
                } 

                localPubKeyDB[pubkeyURL] = { type: "DNS", key: noQuotes, debugPath: "https://dns.google/resolve?name=" + pubkeyURL + '&type=TXT'};
                return localPubKeyDB[pubkeyURL];
            }
        }
    } catch(err) {
        console.error(err);
    }    

    try {
        // Try to download as a file. 
        const txtResponse = await getTXT("https://" + pubkeyURL);

        if (txtResponse.includes("-----BEGIN PUBLIC KEY-----")) { 
            localPubKeyDB[pubkeyURL] = { type: "URL", key: txtResponse, debugPath: "https://" + pubkeyURL };
            return localPubKeyDB[pubkeyURL];
        }
    } catch(err) {
        console.error(err);
    }

    try {   
        const id = pubkeyURL.split('.')[0];
        const group = pubkeyURL.split('.')[1];
        let publicKey = await getGitHubDatabase(id, group);
        if (publicKey != undefined && publicKey.includes("-----BEGIN PUBLIC KEY-----")) { 
            localPubKeyDB[pubkeyURL] = { type: "GITDB", key: publicKey, debugPath: "https://github.com/Path-Check/paper-cred/tree/main/keys/" + group + "/" + id + ".pem" };
            return localPubKeyDB[pubkeyURL];
        } else {
            console.error("GitHub Not Found: "+ publicKey);
        }
    } catch(err) {
        console.error(err);
    }

    return null;
}    

async function getPayloadTypes() {
    if (await localPayloadsDB.length > 0) return await localPayloadsDB;

    try {
        const filesRoot = await getJSON("https://api.github.com/repos/Path-Check/paper-cred/git/trees/main").tree
        const payloadsDir = filesRoot.find(element => element.path === 'payloads');

        const filesPayloads = await getJSON("https://api.github.com/repos/Path-Check/paper-cred/git/trees/"+payloadsDir.sha).tree;

        localPayloadsSpecFiles = filesPayloads.filter(x => x.path.includes(".fields") )
        localPayloadsDB = await localPayloadsSpecFiles.map(x => x.path.replace(/.fields/g,"") );

        return await localPayloadsDB;
    } catch(err) {
        console.error(err);
    }
}

async function payloadTypeExist(type, version) {
  return await getPayloadTypes().includes(type.toLowerCase()+"."+version);
}

async function getPayloadHeader(type, version) {
    if (!await payloadTypeExist(type, version)) return undefined;

    const headerFile = await localPayloadsSpecFiles.find(element => element.path === type.toLowerCase()+"."+version+'.fields');

    try {
        return atob(await getJSON(headerFile.url).content).split("/");
    } catch(err) {
        console.error(err);
        return undefined;
    }
}

module.exports = {
  getKeyId, getPayloadHeader
};

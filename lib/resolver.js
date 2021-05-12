'use strict'

const githubTree = "https://api.github.com/repos/Path-Check/paper-cred/git/trees";

var localPubKeyDB = {};
var localPayloadsDB = [];
var localPayloadsSpecFiles = {};

function getTXT(url) {
    let client = new XMLHttpRequest();
    client.open('GET', url, false);
    //if (url.includes("api.github.com"))
    //    client.setRequestHeader("Authorization","token <GITHUB TOKEN>");
    client.setRequestHeader("Accept", "application/vnd.github.v3+json");
    client.send();
    return client.response;
}

function getJSON(url) {
    return JSON.parse(getTXT(url));
}

async function getGitHubDatabase(id, database) {
    try {
        const rootDir = getJSON(githubTree + "/" + "main").tree

        if (rootDir === undefined) {
            console.debug("GitHub limit exceeded");
            return;
        }

        const databasesDir = rootDir.find(element => element.path === 'keys');

        if (databasesDir === undefined) {
            console.debug("Keys Directory not Found on GitHub");
            return;
        }

        const databases = getJSON(githubTree+"/"+databasesDir.sha).tree
        const databaseDir = databases.find(element => element.path === database);

        if (databaseDir === undefined) {
            //console.debug("Database not found on GitHub " + database);
            return;
        } 
        
        const idsFiles = getJSON(githubTree+"/"+databaseDir.sha).tree
        const idFile = idsFiles.find(element => element.path === id+'.pem');

        if (idFile === undefined) {
            console.debug("Id not found on GitHub " + id);
            return;
        }

        const publicKeyPem = atob(getJSON(idFile.url).content)

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
        const jsonResponse = getJSON("https://dns.google/resolve?name=" + pubkeyURL + '&type=TXT');
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
        console.warn(pubkeyURL, err);
    }    

    try {
        // Try to download as a file. 
        const txtResponse = getTXT("https://" + pubkeyURL);

        if (txtResponse.includes("-----BEGIN PUBLIC KEY-----")) { 
            localPubKeyDB[pubkeyURL] = { type: "URL", key: txtResponse, debugPath: "https://" + pubkeyURL };
            return localPubKeyDB[pubkeyURL];
        }
    } catch(err) {
        //console.warn("https://" + pubkeyURL, err);
    }

    try {   
        const id = pubkeyURL.split('.')[0];
        const group = pubkeyURL.split('.')[1];
        let publicKey = await getGitHubDatabase(id, group);
        if (publicKey != undefined && publicKey.includes("-----BEGIN PUBLIC KEY-----")) { 
            localPubKeyDB[pubkeyURL] = { type: "GITDB", key: publicKey, debugPath: "https://github.com/Path-Check/paper-cred/tree/main/keys/" + group + "/" + id + ".pem" };
            return localPubKeyDB[pubkeyURL];
        } 
    } catch(err) {
        console.warn(pubkeyURL, err);
    }

    return null;
}    

async function getPayloadTypes() {
    if (localPayloadsDB.length > 0) return localPayloadsDB;

    try {
        const filesRoot = getJSON("https://api.github.com/repos/Path-Check/paper-cred/git/trees/main").tree

        if (!filesRoot) return localPayloadsDB;

        const payloadsDir = filesRoot.find(element => element.path === 'payloads');

        const filesPayloads = getJSON("https://api.github.com/repos/Path-Check/paper-cred/git/trees/"+payloadsDir.sha).tree;

        localPayloadsSpecFiles = filesPayloads.filter(x => x.path.includes(".fields") )
        localPayloadsDB = localPayloadsSpecFiles.map(x => x.path.replace(/.fields/g,"") );

        return localPayloadsDB;
    } catch(err) {
        console.error(err);
        return localPayloadsDB;
    }
}

async function payloadTypeExist(type, version) {
  let localDB = await getPayloadTypes();  
  return localDB.includes(type.toLowerCase()+"."+version);
}

async function getPayloadHeader(type, version) {
    let payloadExist = await payloadTypeExist(type, version)
    if (!payloadExist) return undefined;

    const headerFile = localPayloadsSpecFiles.find(element => element.path === type.toLowerCase()+"."+version+'.fields');

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

import fetch from 'cross-fetch';

const gitRawKeyFiles = "https://raw.githubusercontent.com/Path-Check/paper-cred/main/keys"  // + e.g. PCF/1A9.pem
const gitRawPayloadFiles = "https://raw.githubusercontent.com/Path-Check/paper-cred/main/payloads" // + e.g. payloads/badge.1.fields

var localPubKeyDB = {};
var localPayloadsSpecFiles = {};

async function getTXT(url) {
    const res = await fetch(url);
      
    if (res.status >= 400) {
      //console.log(res);
      throw new Error("Bad response from server");
    }

    return await res.text();
}

async function getJSON(url) {
    const res = await fetch(url);
      
    if (res.status >= 400) {
      //console.log(res);
      throw new Error("Bad response from server");
    }

    return await res.json();
}

export async function getKeyId(pubkeyURL) {
    // Download pubkey to verify
    if (localPubKeyDB[pubkeyURL]) {
        return localPubKeyDB[pubkeyURL];
    }
        
    try {
        // Try to download from the DNS TXT record. 
        const jsonResponse = await getJSON("https://dns.google/resolve?name=" + pubkeyURL + '&type=TXT');
        if (jsonResponse.Answer) {
            const pubKeyTxtLookup = jsonResponse.Answer[0].data
            let noQuotes = pubKeyTxtLookup.replace(/\\n/g,"\n");
                
            if (noQuotes) {  
                if (!noQuotes.includes("-----BEGIN PUBLIC KEY-----")) {
                    noQuotes = "-----BEGIN PUBLIC KEY-----" + "\n" + noQuotes + "\n" + "-----END PUBLIC KEY-----\n"
                } 

                localPubKeyDB[pubkeyURL] = { type: "DNS", key: noQuotes, debugPath: "https://dns.google/resolve?name=" + pubkeyURL + '&type=TXT'};
                return localPubKeyDB[pubkeyURL];
            }
        }
    } catch(err) {
        //console.warn(pubkeyURL, err);
    }    

    try {
        // Try to download as a file. 
        const txtResponse = await getTXT("https://" + pubkeyURL);

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
        let publicKey = await getTXT(gitRawKeyFiles + "/" + group + "/" + id + ".pem");
        if (publicKey != undefined && publicKey.includes("-----BEGIN PUBLIC KEY-----")) { 
            localPubKeyDB[pubkeyURL] = { type: "GITDB", key: publicKey, debugPath: "https://github.com/Path-Check/paper-cred/tree/main/keys/" + group + "/" + id + ".pem" };
            return localPubKeyDB[pubkeyURL];
        } 
    } catch(err) {
        //console.warn(pubkeyURL, err);
    }

    return undefined;
}    

export async function getPayloadHeader(type, version) {
  const hash = type.toLowerCase() + "." + version;

  if (localPayloadsSpecFiles[hash])
    return localPayloadsSpecFiles[hash];

  try {
      localPayloadsSpecFiles[hash] = await getTXT(gitRawPayloadFiles + "/" + hash + ".fields");
      return localPayloadsSpecFiles[hash];
  } catch (err) {
      //console.warn("Seeking payload: ", hash, err);
      return undefined;
  }
}
export const INIT_ITEMS = {
    ORG_NAME: `orgName`,
    EXTERNAL_IP: `externalIp`,
    INTERNAL_IP: `internalIp`,
    TLS_CA: `tlsCa`,
    ORG_CA: `orgCa`
}

export const EVENTS = {
    NAVIGATE_TO_APP: `navigate-to-app`,
    HIDE_APP: `hide-app`,
    SHOW_TOP_BAR_ITEMS: 'show-top-bar-items',
    SHOW_PROGRESS_BAR: 'show-progress-bar',
    SHOW_TOAST: 'show-toast'
}

export const MENU_TYPES = {
    PEER : "peer",
    ORDERER: "orderer",
    CA: "ca"
}

export const RESPONSE_STATE = {
    SUCCESS: 'success',
    ERROR: 'error'
}

export function setHostAddresses() {
    console.log("Internal", localStorage.getItem(INIT_ITEMS.INTERNAL_IP));
    console.log("External", localStorage.getItem(INIT_ITEMS.EXTERNAL_IP));
    if (localStorage.getItem(INIT_ITEMS.INTERNAL_IP) && localStorage.getItem(INIT_ITEMS.EXTERNAL_IP)) {
        return {
            hostAddresses: `0.0.0.0,${localStorage.getItem(INIT_ITEMS.INTERNAL_IP)},${localStorage.getItem(INIT_ITEMS.EXTERNAL_IP)}`,
            isSet: true
        }
    }
    return {
        hostAddresses: ``,
        isSet: false
    }
}

export const validateHostAddress = (hostAddresses) => {
    const arr = hostAddresses.split(',');
    const wrongIps = arr.filter(validateIp);
    return wrongIps.length === 0;
}

export const validateSingleIp = (ip) => {
    const result = validateIp(ip);
    console.log("RESULT", result);
    return !result;
}

export const validateNodeAddress = (nodeAddress) => {
    const arr = nodeAddress.split(':');
    if (arr.length === 2) {
        return !validateIp(arr[0]) && isInDesiredForm(arr[1]);
    }
    return false;
}

function validateIp(ip) {
    if ( ip == null || ip === '' ) {
        return true;
    }

    const parts = ip.split('.');
    if(parts.length !== 4) {
        return true;
    }

    for(let i = 0; i < parts.length; i++) {
        const part = parseInt(parts[i]);
        if(part < 0 || part > 255) {
            return true;
        }
    }

    return !!ip.endsWith('.');
}

function isInDesiredForm(str) {
    const n = Math.floor(Number(str));
    return n !== Infinity && String(n) === str && n >= 0;
}
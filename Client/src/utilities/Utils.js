export const INIT_ITEMS = {
    ORG_NAME: `orgName`,
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

export const validateHostAddress = (hostAddresses) => {
    const arr = hostAddresses.split(',');
    const wrongIps = arr.filter(validateIp);
    return wrongIps.length === 0;
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
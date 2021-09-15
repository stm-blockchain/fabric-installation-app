import { EVENTS, RESPONSE_STATE } from "../utilities/Utils";

export default class EventService {
    constructor(vueInstance, summary) {
        this.vueInstance = vueInstance;
        this.summary = summary;
    }

    showProgress(show) {
        this.vueInstance.$emit(EVENTS.SHOW_PROGRESS_BAR, show);
    }

    success(msg) {
        this.showProgress(false);
        this.vueInstance.$emit(EVENTS.SHOW_TOAST, {
            severity: RESPONSE_STATE.SUCCESS,
            summary: this.summary,
            detail: msg
        });
    }

    fail(msg) {
        this.showProgress(false);
        this.vueInstance.$emit(EVENTS.SHOW_TOAST, {
            severity: RESPONSE_STATE.ERROR,
            summary: this.summary,
            detail: msg
        });
    }
}
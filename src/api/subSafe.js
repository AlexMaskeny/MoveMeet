import { debug } from '../config';
export default class SubSafe {
    constructor(props) {
        this.settings = {
            interval: 1000,
            updateThreshold: 1500,
            resetThreshold: 10000,
            subscriptionRenewal: 5 * 1000 * 60,
        }
        this.startTime = Date.now();
        this.time = Date.now();
        this.props = props;
        this.open = false;
    }
    begin() {
        this.open = true;
        this.timer = setInterval(() => {
            const diff = Date.now() - this.time;
            this.time = Date.now();
            if (diff > this.settings.resetThreshold) {
                if (debug) console.warn("SubSafe triggered... ERROR CODE: reset");
                this.props.unsubscribe();
                this.props.navigation.navigate("LoadingPage");
                this.end();
            } else if (diff > this.settings.updateThreshold) {
                if (debug) console.warn("SubSafe triggered... ERROR CODE: update");
                this.props.unsubscribe();
                this.props.refresh();
            }
            const startDiff = Date.now() - this.time;
            if (startDiff > this.settings.subscriptionRenewal) {
                if (debug) console.warn("SubSafe triggered... ERROR CODE: renewal");
                this.props.unsubscribe();
                this.props.refresh();
            }
        }, this.settings.interval);
    }
    end() {
        clearInterval(this.timer);
        this.open = false;
    }
    unsubscribe() {
        return this.props.unsubscribe();
    }
    refresh() {
        return this.props.refresh();
    }
}
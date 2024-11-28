import { AppConfigurationClient } from "@azure/app-configuration";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const etagHeaderPolicy = {
    name: "EtagHeaderPolicy",
 
    sendRequest: async (request, next) => {
 
        console.log("EtagHeaderPolicy received the request url", request.url)
        const url = new URL(request.url);
   
        if (request.headers.has("etag-lookup")) {
            const etag = request.headers.get("etag-lookup");
            request.headers.delete("etag-lookup");
            console.log(request.header)
            url.searchParams.append("etag", etag);
        }

        request.url = url.toString();
        console.log("EtagHeaderPolicy modified the request url to", request.url)
        // console.log(request)
   
        return next(request);
    },
};

const dummyPerRetryPolicy = {
    name: "DummyPerRetryPolicy",

    sendRequest: async (request, next) => {
        console.log("DummyPerRetryPolicy received the request url", request.url)
        return next(request);
    },
}

const emptyTokenCredential = {
    getToken: async () => ({ token: "", expiresOnTimestamp: 0 })
};

class EtagPolicy {
    constructor(){
        this.name = "EtagPolicy";
        this.etag= undefined;
    }

    setEtag(etag) {
        this.etag = etag;
    }

    async sendRequest(request, next) {
        console.log("EtagPolicy received the request url", request.url)
        const url = new URL(request.url);
        if (this.etag) {
            url.searchParams.append("etag", this.etag);
        }

        request.url = url.toString();
        console.log("EtagPolicy modified the request url to", request.url)

        return next(request);
    }
}

class AppConfig {
    constructor(connectionString) {
        this.etagPolicy = new EtagPolicy();
        const clientOptions = { 
            retryOptions: {
                maxRetries: 2
            },
            allowInsecureConnection: true,
            additionalPolicies: [{policy: this.etagPolicy, position: "perCall"}, {policy: dummyPerRetryPolicy, position: "perRetry"}] };
            // additionalPolicies: [{policy: etagHeaderPolicy, position: "perCall"}, {policy: dummyPerRetryPolicy, position: "perRetry"}] };

        // this.client = new AppConfigurationClient(
        //     "https://localhost:3000",
        //     emptyTokenCredential,
        //     clientOptions);

        this.client = new AppConfigurationClient(connectionString, clientOptions);
    }

    async load() {
        const settings = this.client.listConfigurationSettings({requestOptions: {customHeaders: {["etag-lookup"]: "dummy-etag"}}});
        this.etagPolicy.setEtag("dummy-etag");

        // const settings = this.client.listConfigurationSettings();
        for await (const setting of settings) {
            // console.log(setting);
        }
    }
}




const connectionString = "Endpoint=https://zhiyuanliang-ac.azconfig.io;Id=Zr7u;Secret=EBgweCLsAx3jofS5pIWsmV3QMK7ZwwYHAGISGcIP6EIn8224gWkmJQQJ99AKACkVi7rAArohAAACAZAC3LJ3";


const appConfig = new AppConfig(connectionString);

await appConfig.load();


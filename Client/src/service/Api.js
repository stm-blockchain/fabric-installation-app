import axios from 'axios'
// import config from "../utilities/config";

const url = process.env.VUE_APP_DEV_URL || `http://localhost:5000`;

export default () => {
    return axios.create({
        baseURL: url,
    })
}

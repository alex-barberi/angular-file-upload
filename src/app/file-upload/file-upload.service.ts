/*
 * Please see "Using files from web applications":
 * https://developer.mozilla.org/en-US/docs/Using_files_from_web_applications
 */

import {Injectable} from "@angular/core";
import {Subject} from "rxjs/Subject";

@Injectable()
export class FileUploadService {
    private _receivedFirstResponse: boolean;

    constructor() {}

    /**
     * Upload files to a server.
     * @param {string} uploadUri: The URI of the server.
     * @param {string} methodType: ex. POST or PUT.
     * @param {Map<string, string>} headers: Any headers you may need to include. Ex. Authorization header for basic auth.
     * @param {Array<File>} files: The files to upload.
     * @param {Subject<number>} progress: Use an RxJS subject to monitor file upload progress.
     * @param {Subject<XMLHttpRequest>} readyState: Use readyState to find out when files have been uploaded.
     */
    public uploadFiles(uploadUri: string, methodType: string, headers: Map<string, string>,
                       files: Array<File>, progress: Subject<number>, readyState: Subject<XMLHttpRequest>) {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();

        for (let i = 0; i < files.length; i++) {
            formData.append(files[i].name, files[i], files[i].name);
        }

        this._receivedFirstResponse = false;

        xhr.upload.addEventListener("progress", (event: ProgressEvent) => {
            if (event.lengthComputable) {
                const prog = Math.round((event.loaded * 100) / event.total);
                progress.next(prog);
            }
        }, false);

        xhr.onreadystatechange = () => {
            readyState.next(xhr);

            // NO RESPONSE YET? IT LIES TO GIVE US RETURN. WHAT ARE THOSE?
            if (xhr.response && !this._receivedFirstResponse) {
                this._receivedFirstResponse = true;

                // Upload is completed now.
            }
        };

        // methodType POST or PUT?
        xhr.open(methodType, uploadUri, true);

        // headers - must set after opening
        headers.forEach((value, key) => {
            xhr.setRequestHeader(key, value);
        });

        xhr.send(formData);
    }

    /**
     * Convert size to closest Byte size (ie. KB, MB, etc.)
     * @param bytes: The amount of bytes
     * @returns {any}
     */
    public formatSize(bytes: number) {
        if (bytes == 0) {
            return "0 B";
        }

        const k = 1000,
              dm = 3,
              sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
              i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    }

}

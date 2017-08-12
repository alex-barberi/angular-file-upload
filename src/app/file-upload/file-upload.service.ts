/*
 * Please see "Using files from web applications":
 * https://developer.mozilla.org/en-US/docs/Using_files_from_web_applications
 */

import {Injectable} from "@angular/core";
import {FileUploadModel} from "./file-upload.model";

@Injectable()
export class FileUploadService {
    private _receivedFirstResponse: boolean;

    /**
     * Upload files to server.
     * @param {FileUploadModel} uploadData
     */
    public uploadFiles(uploadData: FileUploadModel) {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();

        for (let i = 0; i < uploadData.files.length; i++) {
            formData.append(uploadData.files[i].name, uploadData.files[i], uploadData.files[i].name);
        }

        this._receivedFirstResponse = false;

        xhr.upload.addEventListener("progress", (event: ProgressEvent) => {
            if (event.lengthComputable) {
                const prog = Math.round((event.loaded * 100) / event.total);
                uploadData.progress.next(prog);
            }
        }, false);

        xhr.onreadystatechange = () => {
            uploadData.readyState.next(xhr);

            // NO RESPONSE YET? IT LIES TO GIVE US RETURN. WHAT ARE THOSE?
            if (xhr.response && !this._receivedFirstResponse) {
                this._receivedFirstResponse = true;

                // Upload is completed now.
            }
        };

        // methodType POST or PUT?
        xhr.open(uploadData.methodType, uploadData.uploadUri, true);

        // headers - must set after opening
        uploadData.headers.forEach((value, key) => {
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

import {Injectable} from "@angular/core";
import {Subject} from "rxjs/Subject";

@Injectable()
export class FileUploadService {
    /**
     * Upload a file to a server.
     * @param {string} uploadRoute: The REST API URI.
     * @param {Map<string, string>} headers: Any headers that need to be submitted to the REST API.
     * @param {string} methodType: POST or PUT
     * @param {Array<File>} files: The file(s) to upload.
     * @param {Subject<number>} progress: Used to monitor the upload progress.
     * @param {Subject<XMLHttpRequest>} readyState: Used to monitor when the upload is complete.
     */
    public uploadFiles(uploadRoute: string, headers: Map<string, string>, methodType: string, files: Array<File>,
                       progress: Subject<number>, readyState: Subject<XMLHttpRequest>) {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();

        // Add all of the files to a form.
        for (let i = 0; i < files.length; i++) {
            formData.append(files[i].name, files[i], files[i].name);
        }

        // Setup a progress event listener
        xhr.upload.addEventListener("progress", (event: ProgressEvent) => {
            if (event.lengthComputable) {
                const prog = Math.round((event.loaded * 100) / event.total);
                progress.next(prog);
            }
        }, false);

        // Listen to ready state to know when the files are uploaded
        xhr.onreadystatechange = () => {
            readyState.next(xhr);
        };

        // Open a connection to the API
        xhr.open(methodType, uploadRoute, true);

        // Add headers - must set headers after opening the connection
        headers.forEach((value, key) => {
            xhr.setRequestHeader(key, value);
        });

        // Send the form with the files
        xhr.send(formData);
    }

    public formatSize(bytes) {
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

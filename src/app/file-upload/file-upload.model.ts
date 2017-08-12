import {Subject} from "rxjs/Subject";

export class FileUploadModel {
    public uploadUri: string;                       // The URI of the server.
    public methodType: string;                      // ex. POST or PUT.
    public headers: Map<string, string>;            // Any headers you may need to include. Ex. headers.set("Authorization", "abc123");
    public files: Array<File>;                      // The files to upload.
    public progress: Subject<number>;               // Use an RxJS subject to monitor file upload progress.
    public readyState: Subject<XMLHttpRequest>;     // Use readyState to find out when files have been uploaded.
}

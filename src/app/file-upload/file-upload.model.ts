import {Subject} from "rxjs/Subject";

export class FileUploadModel {
    public files: Array<File>;                      // The files to upload.
    public progress: Subject<number>;               // Use an RxJS subject to monitor file upload progress.
    public readyState: Subject<XMLHttpRequest>;     // Use readyState to find out when files have been uploaded.
}

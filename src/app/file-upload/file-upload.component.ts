import {Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnInit} from "@angular/core";

import {Subject} from "rxjs/Subject";
import {FileUploadModel} from "./file-upload.model";

@Component({
    selector: "file-upload",
    templateUrl: "./file-upload.component.html",
    styleUrls: ["./file-upload.component.scss"]
})
export class FileUploadComponent implements OnInit {
    @Input() public uploadUri: string;
    @Input() public uploadHeaders: Map<string, string>;
    @Input() public uploadMethodType: string;
    @Input() public allowMultiple: boolean;
    @Input() public maxFileSize: number;
    @Input() public showUploadBox: boolean;

    @Output() public beginUploadFiles: EventEmitter<FileUploadModel> = new EventEmitter<FileUploadModel>();

    @Output() public acceptedFilesSelected: EventEmitter<Array<File>>;
    @Output() public progressEvent: EventEmitter<number>;
    @Output() public responseEvent: EventEmitter<XMLHttpRequest>;
    @Output() public uploadResponseEvent: EventEmitter<any>;

    @ViewChild("filePicker") filePicker: ElementRef;

    public acceptedFileExtensions: Array<any> = [
        { ext: "jpg",  mime: "image/jpeg" },
        { ext: "jpeg", mime: "image/jpeg" },
        { ext: "png",  mime: "image/png" },
        { ext: "gif",  mime: "image/gif" },
        { ext: "svg",  mime: "application/xml" },
        { ext: "pdf",  mime: "application/pdf" },
        { ext: "doc",  mime: "application/msword" },
        { ext: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
        { ext: "xls",  mime: "application/vnd.ms-excel" },
        { ext: "xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
        { ext: "ppt",  mime: "application/vnd.ms-powerpoint" },
        { ext: "pptx", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation" }
    ];

    public uploadingFiles: Array<File>;
    public uploadInProgress: boolean;

    public highlight: boolean;
    public warnings = [];

    public progressSubject: Subject<number>;
    public readyStateSubject: Subject<XMLHttpRequest>;

    ngOnInit() {
        this.acceptedFilesSelected = new EventEmitter<Array<File>>();
        this.progressEvent = new EventEmitter<number>();
        this.responseEvent = new EventEmitter<XMLHttpRequest>();
        this.uploadResponseEvent = new EventEmitter<any>();

        this.uploadInProgress = false;
        this.highlight = false;
        this.warnings = [];

        this.progressSubject = new Subject<number>();
        this.readyStateSubject = new Subject<XMLHttpRequest>();

        this.progressSubject.subscribe((progress: number) => {
            this.MonitorProgress(progress);
        });

        this.readyStateSubject.subscribe((xhr: XMLHttpRequest) => {
            this.MonitorResponse(xhr);
        });
    }

    //#region Validation
    private ValidateFile(file: File) {
        return (this.ValidateFileExtension(file.name) && this.ValidateFileSize(file));
    }

    private ValidateFileExtension(fileName: string): boolean {
        // Get the file extension
        const fileExtension = this.GetFileExtension(fileName);

        // No file extension? File is not valid. Return false.
        if (fileExtension == "") {
            this.warnings.push({ message: "A file extension is required", unacceptedFiles: null });
            return false;
        }

        // Convert everything to lowercase and check for index of file extension in array of valid extension
        const fileExtensionIndex = this.acceptedFileExtensions.map(x => x.ext.trim().toLowerCase()).indexOf(fileExtension.toLowerCase());

        // If > -1 Then
        //   extension was found in array. return true
        // Else
        //   return false
        return fileExtensionIndex > -1;
    }

    private GetFileExtension(fileName: string): string {
        // Split file name by dot so we can get the extension at the end
        const fileNameSplit = fileName.split(".");

        // After split at the dot, length should be 2 (filename and extension).
        // However, some filenames will have multiple dots in them, so length can be greater than 2.
        if (fileNameSplit == null || fileNameSplit.length < 2) {
            // Unable to split string at the dot? Invalid file name.
            // A file extension is required, so return empty string (this file is not valid).
            return "";
        }

        // Last item in array is the file extension
        return fileNameSplit[fileNameSplit.length - 1];
    }

    private ValidateFileSize(file: File) {
        if (file.size > this.maxFileSize) {
            this.warnings.push({ message: "File exceeds size limit", unacceptedFiles: [file] });
            return false;
        }
        else {
            return true;
        }
    }

    private CreateObjectUrl(file: File): string {
        if (!file || file.size <= 0) {
            return "";
        }

        return window.URL.createObjectURL(file);
        // window.URL.revokeObjectURL(objectURL);    // Do we need to release this bad boy?
    }
    //#endregion Validation

    //#region Drag and Drop
    private DragOver(event) {
        event.stopPropagation();
        event.preventDefault();

        if (!this.uploadInProgress) {
            this.highlight = true;
        }
    }

    private DragEnter(event) {
        event.stopPropagation();
        event.preventDefault();

        if (!this.uploadInProgress) {
            this.highlight = true;
        }
    }

    private DragLeave(event) {
        event.stopPropagation();
        event.preventDefault();

        this.highlight = false;
    }

    private Drop(event): void {
        event.stopPropagation();
        event.preventDefault();

        this.UploadFiles(event);
    }
    //#endregion Drag and Drop

    private UploadFiles(evt) {
        // Turn off the DragOver highlight
        this.highlight = false;

        // Upload already in progress? Exit
        if (this.uploadInProgress) {
            return;
        }

        // Clear any previous upload warnings
        this.warnings = [];

        if (!this.uploadUri || this.uploadUri == "") {
            this.warnings.push({ message: "Upload URI is required.", unacceptedFiles: [] });
            return;
        }

        let files;

        if (evt.dataTransfer) {
            files = evt.dataTransfer.files;
        }
        else {
            files = evt.target.files;
        }

        // No files were dropped? Exit
        if (files.length <= 0) {
            return;
        }

        // Only one file is allowed? Let the user know and Exit.
        if (files.length > 1 && this.allowMultiple == false) {
            this.warnings.push({ message: "Only one file is allowed.", unacceptedFiles: evt.dataTransfer.files });
            return;
        }

        const acceptedFiles: Array<File> = [];
        const unacceptedFiles: Array<File> = [];

        // Loop over files to make sure they are valid
        for (let i = 0; i < files.length; i++) {
            // File extension is in _acceptedFileExtensions?
            const isFileValid = this.ValidateFile(files[i]);
            if (isFileValid) {
                acceptedFiles.push(files[i]);
            }
            else {
                // Save list of unaccepted files so we can let the user know
                unacceptedFiles.push(files[i]);
            }
        }

        // No files have been accepted? Exit.
        if (acceptedFiles.length <= 0) {
            this.warnings.push({ message: "There were no valid files.", unacceptedFiles: unacceptedFiles });
            return;
        }

        // Files have been accepted
        this.acceptedFilesSelected.emit(acceptedFiles);

        // Display this list to the user
        this.uploadingFiles = acceptedFiles;
        this.uploadInProgress = true;

        // Upload the accepted files
        const uploadData: FileUploadModel = {
            uploadUri: this.uploadUri,
            headers: this.uploadHeaders,
            methodType: this.uploadMethodType,
            files: acceptedFiles,
            progress: this.progressSubject,
            readyState: this.readyStateSubject
        };

        console.log(uploadData);

        this.beginUploadFiles.emit(uploadData);
    }

    public MonitorProgress(progress: number) {
        // console.log("progress", progress);
        this.progressEvent.emit(progress);

        if (progress >= 100) {
            this.uploadInProgress = false;
        }
    }

    public MonitorResponse(xhr: XMLHttpRequest) {
        if (!xhr) {
            return;
        }

        if (xhr.response) {
            this.uploadResponseEvent.emit(xhr.response);
        }
    }

    public OpenFilePicker() {
        this.filePicker.nativeElement.click();
    }

    private OnFileSelect(event) {
        this.UploadFiles(event);
    }

}

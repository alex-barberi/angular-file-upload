import {Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnInit} from "@angular/core";
import {DomSanitizer} from "@angular/platform-browser";
import {Subject} from "rxjs/Subject";
import {FileUploadModel} from "./file-upload.model";

@Component({
    selector: "bci-file-upload",
    templateUrl: "./file-upload.component.html",
    styleUrls: ["./file-upload.component.scss"]
})
export class FileUploadComponent implements OnInit {
    @Input() public allowMultiple: boolean;
    @Input() public maxFileSize: number;
    @Input() public showDragDropBox: boolean;
    @Input() public disabled: boolean;

    @Input() public btnCssClass: string;
    @Input() public uploadBoxCssClass: string;
    @Input() public uploadGuidanceHtml: string;
    @Input() public btnFileSelectorHtml: string;

    @Output() public beginUploadFiles: EventEmitter<FileUploadModel> = new EventEmitter<FileUploadModel>();

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

    public highlight: boolean;
    public warnings: Array<any>;

    private progressSubject: Subject<number>;
    private readyStateSubject: Subject<XMLHttpRequest>;

    constructor(
        public sanitizer: DomSanitizer
    ) {
        this.highlight = false;
        this.warnings = [];

        this.progressSubject = new Subject<number>();
        this.readyStateSubject = new Subject<XMLHttpRequest>();
    }

    ngOnInit() {
        if (!this.btnCssClass) {
            this.btnCssClass = "btn-file-upload";
        }

        if (!this.uploadBoxCssClass) {
            this.uploadBoxCssClass = "drag-drop-location";
        }

        if (!this.btnFileSelectorHtml) {
            if (this.allowMultiple) {
                this.btnFileSelectorHtml = "Choose File(s)";
            }
            else {
                this.btnFileSelectorHtml = "Choose File";
            }
        }
    }

    //#region Validation
    public ValidateFile(file: File) {
        return (this.ValidateFileExtension(file.name) && this.ValidateFileSize(file));
    }

    public ValidateFileExtension(fileName: string): boolean {
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

    public GetFileExtension(fileName: string): string {
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

    public ValidateFileSize(file: File) {
        if (file.size > this.maxFileSize) {
            this.warnings.push({ message: "File exceeds size limit", unacceptedFiles: [file] });
            return false;
        }
        else {
            return true;
        }
    }

    public CreateObjectUrl(file: File): string {
        if (!file || file.size <= 0) {
            return "";
        }

        return window.URL.createObjectURL(file);
        // window.URL.revokeObjectURL(objectURL);    // Do we need to release this bad boy?
    }
    //#endregion Validation

    //#region Drag and Drop
    public DragOver(event) {
        event.stopPropagation();
        event.preventDefault();

        if (!this.disabled) {
            this.highlight = true;
        }
    }

    public DragEnter(event) {
        event.stopPropagation();
        event.preventDefault();

        if (!this.disabled) {
            this.highlight = true;
        }
    }

    public DragLeave(event) {
        event.stopPropagation();
        event.preventDefault();

        this.highlight = false;
    }

    public Drop(event): void {
        event.stopPropagation();
        event.preventDefault();

        this.UploadFiles(event);
    }
    //#endregion Drag and Drop

    public UploadFiles(evt) {
        // Turn off the DragOver highlight
        this.highlight = false;

        // Upload already in progress? Exit
        if (this.disabled) {
            return;
        }

        // Clear any previous upload warnings
        this.warnings = [];

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

        const uploadData: FileUploadModel = {
            files: acceptedFiles,
            progress: this.progressSubject,
            readyState: this.readyStateSubject
        };

        this.beginUploadFiles.emit(uploadData);
    }

    public OpenFilePicker() {
        this.filePicker.nativeElement.click();
    }

    public OnFileSelect(event) {
        this.UploadFiles(event);
    }

}

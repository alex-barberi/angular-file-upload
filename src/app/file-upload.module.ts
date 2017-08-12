import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";

import { AppComponent } from "./app.component";
import {FileUploadComponent} from "./file-upload/file-upload.component";
import {FileUploadService} from "./file-upload/file-upload.service";

@NgModule({
    imports: [
        BrowserModule
    ],
    declarations: [
        AppComponent,
        FileUploadComponent
    ],
    exports: [
        FileUploadComponent
    ],
    providers: [
        FileUploadService
    ],
    bootstrap: [AppComponent]
})
export class FileUploadModule {}

import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";

import { AppComponent } from "./app.component";
import {FileUploadComponent} from "./file-upload/file-upload.component";

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
    providers: [],
    bootstrap: [AppComponent]
})
export class FileUploadModule { }

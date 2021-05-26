import React from "react";
import "./Homepage.css";
import { Document, Page, pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

class Homepage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.handleUpload = this.handleUpload.bind(this);
    this.mergePDFs = this.mergePDFs.bind(this);
  }

  async handleUpload(event) {
    const fileBuffers = [];
    for (const file of event.target.files) {
      fileBuffers.push(new Uint8Array(await file.arrayBuffer()));
    }

    this.setState({
      fileBuffers: fileBuffers.map(uintarray => Array.from(uintarray)),
      fileUrls: Array.from(event.target.files).map(file => URL.createObjectURL(file))
    });
  }

  async mergePDFs() {
    const res = await fetch("http://localhost:9000/pdf-merger", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ urls: this.state.fileBuffers })
    });

    const mergedPdf = await res.json();
    const mergedPdfBuffer = new Uint8Array(mergedPdf.data.split(",")).buffer;
    const mergedPdfFile = new File([mergedPdfBuffer], "merged.pdf", { type: "application/pdf" })
    const mergedPdfUrl = URL.createObjectURL(mergedPdfFile);

    this.setState({
      mergedUrl: mergedPdfUrl
    });
  }

  render() {
    return (
      <div className="container">
        <div className="pdfMerged">
          {this.state.mergedUrl && <embed src={this.state.mergedUrl} className="pdfEmbed" />}
        </div>
        <div className="pdfViewer">
          <div className="buttons">
            <label htmlFor="pdf1" className="upload">Upload files to merge</label>
            <input type="file" name="pdf1" id="pdf1" accept="application/pdf" onChange={this.handleUpload} multiple />
            <button className="upload" id="mergeButton" onClick={this.mergePDFs}>Merge</button>
          </div>
          <div className="pdfPreview">
            {this.state.fileUrls && this.state.fileUrls.map((url, i) => {
              return (
                <Document file={url} key={i}>
                  <Page pageNumber={1} />
                </Document>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}

export default Homepage;
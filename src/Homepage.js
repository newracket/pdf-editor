import React from "react";
import "./Homepage.css";
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFDocument } from 'pdf-lib';
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
      files: event.target.files,
      fileBuffers: fileBuffers.map(uintarray => Array.from(uintarray)),
      fileUrls: Array.from(event.target.files).map(file => URL.createObjectURL(file))
    });
  }

  async mergePDFs() {
    const mergedDoc = await PDFDocument.create();

    for (const buffer of this.state.fileBuffers) {
      const pdfDoc = await PDFDocument.load(new Uint8Array(buffer));
      const pdfPages = await mergedDoc.copyPages(pdfDoc, [...Array(pdfDoc.getPageCount()).keys()]);

      pdfPages.forEach(pdfPage => mergedDoc.addPage(pdfPage));
    };

    const pdfBytes = await mergedDoc.save();
    const mergedPdfBuffer = new Uint8Array(pdfBytes).buffer;
    const mergedPdfFile = new File([mergedPdfBuffer], "merged.pdf", { type: "application/pdf" })
    const mergedPdfUrl = URL.createObjectURL(mergedPdfFile);

    this.setState({
      mergedUrl: mergedPdfUrl
    });
  }

  onDragOver(event) {
    event.preventDefault();
  }

  onDragStart(event, id) {
    event.dataTransfer.setData("id", id);
  }

  onDrop(event) {
    new Promise((resolve, reject) => {
      const id = event.dataTransfer.getData("id");
      const cards = Array.from(document.querySelectorAll("[id^='draggable']"));
      const firstCards = cards.filter((card, i) => card.getBoundingClientRect().top !== cards[i - 1]?.getBoundingClientRect().top);
      const lastCards = cards.filter((card, i) => card.getBoundingClientRect().top !== cards[i + 1]?.getBoundingClientRect().top);

      firstCards.forEach(firstCard => {
        const bounds = firstCard.getBoundingClientRect();
        if (event.pageX < (bounds.left + 20) && event.pageY < bounds.bottom && event.pageY > bounds.top) {
          const fileUrls = this.state.fileUrls.slice(0);
          fileUrls.splice(0, 0, fileUrls[id]);
          fileUrls.splice(parseInt(id) + 1, 1);

          const fileBuffers = this.state.fileBuffers.slice(0);
          fileBuffers.splice(0, 0, fileBuffers[id]);
          fileBuffers.splice(parseInt(id) + 1, 1);

          this.setState({
            fileUrls,
            fileBuffers
          });
          resolve();
        }
      });

      lastCards.forEach(lastCard => {
        const bounds = lastCard.getBoundingClientRect();
        if (event.pageX > (bounds.right) && event.pageY < bounds.bottom && event.pageY > bounds.top) {
          const fileUrls = this.state.fileUrls.slice(0);
          fileUrls.splice(cards.indexOf(lastCard) + 1, 0, fileUrls[id]);
          fileUrls.splice(parseInt(id), 1);

          const fileBuffers = this.state.fileBuffers.slice(0);
          fileBuffers.splice(cards.indexOf(lastCard) + 1, 0, fileBuffers[id]);
          fileBuffers.splice(parseInt(id), 1);

          this.setState({
            fileUrls,
            fileBuffers
          });

          resolve();
        }
      });

      cards.forEach((card, i) => {
        const bounds = card.getBoundingClientRect();
        if (event.pageX > bounds.right && (cards[i + 1] && event.pageX < cards[i + 1].getBoundingClientRect().right) &&
          event.pageY < bounds.bottom && event.pageY > bounds.top) {
          const fileUrls = this.state.fileUrls.slice(0);
          fileUrls.splice(i + 1, 0, fileUrls[id]);

          const fileBuffers = this.state.fileBuffers.slice(0);
          fileBuffers.splice(i + 1, 0, fileBuffers[id]);

          if (id > i) {
            fileUrls.splice(parseInt(id) + 1, 1);
            fileBuffers.splice(parseInt(id) + 1, 1);
          }
          else {
            fileUrls.splice(id, 1);
            fileBuffers.splice(id, 1);
          }

          this.setState({
            fileUrls,
            fileBuffers
          });
        }
      });
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
          <div className="pdfPreview" onDragOver={e => this.onDragOver(e)} onDrop={e => this.onDrop(e)}>
            {this.state.fileUrls && this.state.fileUrls.map((url, i) => {
              return (
                <div key={i} id={`draggable${i}`} draggable onDragStart={e => this.onDragStart(e, i)}>
                  <Document file={url}>
                    <Page pageNumber={1} />
                  </Document>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
}

export default Homepage;
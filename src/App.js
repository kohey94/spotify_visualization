// src/App.js
import React, { useState } from 'react';
import JSZip from 'jszip';

function App() {
  const [files, setFiles] = useState([]);
  const [tableData, setTableData] = useState([]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file || !file.name.endsWith('.zip')) return;

    const zip = new JSZip();
    const zipContent = await zip.loadAsync(file);
    const entries = [];

    for (const filename of Object.keys(zipContent.files)) {
      const fileObj = zipContent.files[filename];
      if (!fileObj.dir && filename.endsWith('.json')) {
        const content = await fileObj.async('string');
        entries.push({ name: filename, content });
      }
    }

    setFiles(entries);
    setTableData([]); // 表データは初期化
  };

  const handleSelectFile = (content) => {
    try {
      const json = JSON.parse(content);
      const filtered = json.map((item) => ({
        track: item.master_metadata_track_name || '',
        artist: item.master_metadata_album_artist_name || '',
        album: item.master_metadata_album_album_name || '',
      }));
      setTableData(filtered);
    } catch (e) {
      console.error('Invalid JSON format', e);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>My Spotify Data Viewer</h1>
      <input type="file" onChange={handleFileChange} />

      <h3>Available JSON Files:</h3>
      <ul>
        {files.map((f, idx) => (
          <li key={idx}>
            <button onClick={() => handleSelectFile(f.content)}>
              {f.name}
            </button>
          </li>
        ))}
      </ul>

      {tableData.length > 0 && (
        <>
          <h3>Streaming History Table</h3>
          <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Track Name</th>
                <th>Artist</th>
                <th>Album</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.track}</td>
                  <td>{item.artist}</td>
                  <td>{item.album}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default App;

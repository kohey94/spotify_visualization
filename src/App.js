import React, { useState } from 'react';
import JSZip from 'jszip';

function App() {
  const [files, setFiles] = useState([]);
  const [trackRanking, setTrackRanking] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file || !file.name.endsWith('.zip')) return;

    const zip = new JSZip();
    const zipContent = await zip.loadAsync(file);
    const entries = [];
    const combinedData = [];

    for (const filename of Object.keys(zipContent.files)) {
      if (
        filename.endsWith('.json') &&
        filename.includes('Streaming_History_Audio') &&
        !filename.includes('Video')
      ) {
        const fileObj = zipContent.files[filename];
        const content = await fileObj.async('string');

        try {
          const json = JSON.parse(content);
          combinedData.push(...json);
          entries.push({ name: filename, content });
        } catch (e) {
          console.error('JSON parse error in:', filename, e);
        }
      }
    }

    // 曲ごとの集計
    const countMap = {};
    const trackInfoMap = {};

    for (const item of combinedData) {
      const uri = item.spotify_track_uri || 'unknown_uri';
      countMap[uri] = (countMap[uri] || 0) + 1;

      if (!trackInfoMap[uri]) {
        trackInfoMap[uri] = {
          name: item.master_metadata_track_name || 'Unknown',
          artist: item.master_metadata_album_artist_name || 'Unknown',
          album: item.master_metadata_album_album_name || 'Unknown',
        };
      }
    }

    const ranking = Object.entries(countMap)
      .sort((a, b) => b[1] - a[1])
      .map(([uri, count]) => ({
        uri,
        count,
        name: trackInfoMap[uri].name,
        artist: trackInfoMap[uri].artist,
        album: trackInfoMap[uri].album,
      }));

    setFiles(entries);
    setTrackRanking(ranking);
    setCurrentPage(1);
  };

  const filteredRanking = trackRanking.filter((item) =>
    item.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedRanking = filteredRanking.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredRanking.length / itemsPerPage);

  return (
    <div style={{ padding: 20 }}>
      <h1>My Spotify Top Tracks</h1>
      <input type="file" onChange={handleFileChange} />

      <h3>Loaded JSON Files:</h3>
      <ul>
        {files.map((f, idx) => (
          <li key={idx}>{f.name}</li>
        ))}
      </ul>

      {trackRanking.length > 0 && (
        <>
          <div style={{ margin: '20px 0' }}>
            <label htmlFor="search">Search by Artist: </label>
            <input
              type="text"
              id="search"
              placeholder="e.g. 米津玄師"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{ padding: '5px', width: '300px' }}
            />
          </div>

          <h3>Top Tracks (Page {currentPage} / {totalPages})</h3>
          <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Track Name</th>
                <th>Artist</th>
                <th>Album</th>
                <th>Plays</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRanking.map((item, idx) => (
                <tr key={item.uri}>
                  <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.artist}</td>
                  <td>{item.album}</td>
                  <td>{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 20 }}>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                style={{
                  margin: '0 5px',
                  padding: '5px 10px',
                  background: currentPage === idx + 1 ? '#ccc' : '#eee',
                  border: '1px solid #999',
                  cursor: 'pointer'
                }}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default App;

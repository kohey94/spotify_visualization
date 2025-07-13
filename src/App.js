import React, { useState } from 'react';
import JSZip from 'jszip';

function App() {
  const [files, setFiles] = useState([]);
  const [trackRanking, setTrackRanking] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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

    setFiles(entries);
    updateRanking(combinedData, searchTerm, startDate, endDate);
  };

  const updateRanking = (data, artistFilter, start, end) => {
    const countMap = {};
    const trackInfoMap = {};

    const filteredData = data.filter((item) => {
      const ts = new Date(item.ts);
      const matchArtist = item.master_metadata_album_artist_name
        ?.toLowerCase()
        .includes(artistFilter.toLowerCase());

      const matchStart = start ? ts >= new Date(start) : true;
      const matchEnd = end ? ts <= new Date(end) : true;

      return matchArtist && matchStart && matchEnd;
    });

    for (const item of filteredData) {
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

    setTrackRanking(ranking);
    setCurrentPage(1);
  };

  const handleFilterChange = (field, value) => {
    if (field === 'artist') setSearchTerm(value);
    if (field === 'start') setStartDate(value);
    if (field === 'end') setEndDate(value);
  };

  const handleApplyFilter = () => {
    // フィルター再適用
    if (files.length === 0) return;
    let combinedData = [];
    for (const file of files) {
      try {
        const json = JSON.parse(file.content);
        combinedData.push(...json);
      } catch (e) {
        console.error('Error parsing file:', file.name);
      }
    }
    updateRanking(combinedData, searchTerm, startDate, endDate);
  };

  const paginatedRanking = trackRanking.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(trackRanking.length / itemsPerPage);

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
          {/* フィルター */}
          <div style={{ margin: '20px 0' }}>
            <label style={{ marginRight: 10 }}>
              Artist:
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleFilterChange('artist', e.target.value)}
                style={{ marginLeft: 5 }}
              />
            </label>
            <label style={{ marginRight: 10 }}>
              Start Date:
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleFilterChange('start', e.target.value)}
                style={{ marginLeft: 5 }}
              />
            </label>
            <label style={{ marginRight: 10 }}>
              End Date:
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleFilterChange('end', e.target.value)}
                style={{ marginLeft: 5 }}
              />
            </label>
            <button onClick={handleApplyFilter} style={{ marginLeft: 10 }}>
              Apply Filter
            </button>
          </div>

          {/* ランキングテーブル */}
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

          {/* ページネーション */}
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

export default function AntennaDisplay() {
  return (
    <div className="glass-card h-full relative" style={{ overflow: 'auto' }}>
      <iframe
        src="http://8.145.43.245:8082/"
        style={{ width: '100%', height: '100%', minHeight: '720px', border: 0, display: 'block' }}
        title="天线监控"
        allow="fullscreen"
        scrolling="yes"
      />
    </div>
  );
}

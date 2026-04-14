import { useRef, useState } from 'react';

export default function ImageUpload({ value, onChange, label = 'Image', multiple = false }) {
  const ref = useRef();
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    const files = multiple ? Array.from(e.target.files) : e.target.files[0];
    onChange(files);
    if (!multiple && files) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(files);
    }
  };

  return (
    <div className="admin-component-image-upload" id="admin-component-image-upload">
      <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>{label}</label>
      <div
        onClick={() => ref.current.click()}
        style={{ border: '2px dashed #e2e2e2', borderRadius: 8, padding: 20, textAlign: 'center', cursor: 'pointer', background: '#fafafa' }}>
        {preview || value ? (
          <img src={preview || (typeof value === 'string' ? value : value?.url)} alt=""
            style={{ maxHeight: 120, maxWidth: '100%', objectFit: 'contain', borderRadius: 6 }} />
        ) : (
          <p style={{ color: '#aaa', fontSize: 13, margin: 0 }}>Click to upload {multiple ? 'images' : 'an image'}</p>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple={multiple}
        style={{ display: 'none' }} onChange={handleChange} />
    </div>
  );
}
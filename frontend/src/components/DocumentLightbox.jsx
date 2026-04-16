import Modal from '@cloudscape-design/components/modal';
import Box from '@cloudscape-design/components/box';

export default function DocumentLightbox({ visible, imageSrc, altText, onClose }) {
  return (
    <Modal
      visible={visible}
      onDismiss={onClose}
      header={<Box variant="h3">Document Preview</Box>}
      size="large"
    >
      <Box textAlign="center">
        <img
          src={imageSrc}
          alt={altText}
          style={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            objectFit: 'contain',
          }}
        />
      </Box>
    </Modal>
  );
}

import { useState, useCallback } from 'react'
import { Client } from "@gradio/client"
import { Container, Title, Select, FileInput, Button, Text, Paper, Image, SimpleGrid, Box, Stack, Alert, Progress } from '@mantine/core'

// Import all example images
import catImage from './images/cat.jpg'
import dogImage from './images/dog.jpg'
import teddyImage from './images/teddy.jpg'
import grizzlyImage from './images/grizzly.jpg'
import dunnoImage from './images/dunno.jpg'
import blackImage from './images/black.jpg'

function App() {
  const [file, setFile] = useState(null)
  const [modelChoice, setModelChoice] = useState('Cat vs Dog')
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [error, setError] = useState(null)

  // All example images in a single array
  const exampleImages = [
    catImage,
    dogImage,
    teddyImage,
    grizzlyImage,
    dunnoImage,
    blackImage
  ]

  const handleFileChange = (file) => {
    setFile(file)
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setPrediction(null)
      setError(null)
    }
  }

  const handleExampleClick = async (imagePath) => {
    try {
      setError(null)
      setPrediction(null)
      const response = await fetch(imagePath)
      const blob = await response.blob()
      const file = new File([blob], 'example.jpg', { type: 'image/jpeg' })
      setFile(file)
      setPreviewUrl(imagePath)
    } catch {
      setError('Failed to load example image')
    }
  }

  const classifyImage = useCallback(async () => {
    if (!file) return

    setLoading(true)
    setError(null)
    
    try {
      const client = await Client.connect("shawizir/fastai")
      const result = await client.predict(
        "/classify_image",
        [
          file,
          modelChoice,
        ],
        {
          timeout: 30000
        }
      )

      if (result && result.data && result.data[0]) {
        setPrediction(result.data[0])
      } else {
        throw new Error('Invalid response from server')
      }
    } catch {
      setError('Error classifying image. Please try again.')
      setPrediction(null)
    } finally {
      setLoading(false)
    }
  }, [file, modelChoice])

  const renderPrediction = () => {
    if (!prediction) {
      return (
        <Stack align="center" justify="center" h={200}>
          <Text c="dimmed" ta="center">
            Select a model and image to see predictions
          </Text>
        </Stack>
      );
    }

    return (
      <Stack>
        <Title order={4} mb="md">Prediction Results</Title>
        <Text fw={500} size="xl" mb="lg">{prediction.label}</Text>
        {prediction.confidences && (
          <Stack spacing="xs">
            <Text size="sm" fw={500}>Confidence Scores:</Text>
            {prediction.confidences.map((conf, index) => (
              <Box key={index}>
                <Text size="sm" mb={4}>{conf.label}: {(conf.confidence * 100).toFixed(1)}%</Text>
                <Progress 
                  value={conf.confidence * 100} 
                  color={index === 0 ? "blue" : "gray"}
                  size="sm"
                />
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    );
  };

  return (
    <Container size="lg" py="xl">
      <Title order={1} mb="xl" ta="center">Image Classifier</Title>

      <Stack spacing="md">
        <SimpleGrid cols={2} spacing="md" breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
          <Paper shadow="xs" p="md" withBorder>
            <Title order={3} mb="md">Upload Image</Title>
            <Select
              label="Select Model"
              placeholder="Choose a model"
              value={modelChoice}
              onChange={(value) => {
                setModelChoice(value)
                setPrediction(null)
                setError(null)
              }}
              data={[
                'Cat vs Dog',
                'Bear Classifier',
              ]}
              mb="md"
            />

            <FileInput
              label="Upload Image"
              placeholder="Choose an image"
              accept="image/*"
              onChange={handleFileChange}
              mb="md"
            />

            {previewUrl && (
              <Box mb="md">
                <Text fw={500} mb="xs">Preview:</Text>
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fit="contain"
                  height={200}
                />
              </Box>
            )}

            <Button
              onClick={classifyImage}
              loading={loading}
              disabled={!file || loading}
              fullWidth
              mb="md"
            >
              {loading ? 'Classifying...' : 'Classify Image'}
            </Button>

            {error && (
              <Alert color="red" mb="md" title="Error">
                {error}
              </Alert>
            )}
          </Paper>

          <Paper shadow="xs" p="md" withBorder>
            {renderPrediction()}
          </Paper>
        </SimpleGrid>

        <Paper shadow="xs" p="md" withBorder>
          <Title order={3} mb="md">Example Images</Title>
          <Text size="sm" mb="md">Click any image to classify it:</Text>
          <SimpleGrid cols={6} spacing="md" breakpoints={[
            { maxWidth: 'md', cols: 3 },
            { maxWidth: 'sm', cols: 2 }
          ]}>
            {exampleImages.map((image, index) => (
              <Paper 
                key={index} 
                shadow="sm" 
                p="xs"
                withBorder
                style={{ cursor: 'pointer' }}
                onClick={() => handleExampleClick(image)}
              >
                <Image
                  src={image}
                  alt={`Example ${index + 1}`}
                  fit="cover"
                  height={120}
                />
              </Paper>
            ))}
          </SimpleGrid>
        </Paper>
      </Stack>
    </Container>
  )
}

export default App

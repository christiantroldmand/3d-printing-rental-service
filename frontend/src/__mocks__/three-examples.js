// Mock for three/examples/jsm loaders
export const STLLoader = jest.fn().mockImplementation(() => ({
  load: jest.fn((url, onLoad, onProgress, onError) => {
    // Mock successful load
    const mockGeometry = {
      getAttribute: jest.fn().mockReturnValue({
        count: 1000
      }),
      computeBoundingBox: jest.fn(),
      computeVertexNormals: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      setAttribute: jest.fn()
    };
    setTimeout(() => onLoad(mockGeometry), 100);
  }),
  parse: jest.fn((buffer) => {
    // Mock successful parse
    const mockGeometry = {
      getAttribute: jest.fn().mockReturnValue({
        count: 1000
      }),
      computeBoundingBox: jest.fn(),
      computeVertexNormals: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      setAttribute: jest.fn()
    };
    return mockGeometry;
  })
}));

export const OBJLoader = jest.fn().mockImplementation(() => ({
  load: jest.fn((url, onLoad, onProgress, onError) => {
    // Mock successful load
    const mockGroup = {
      traverse: jest.fn()
    };
    setTimeout(() => onLoad(mockGroup), 100);
  }),
  parse: jest.fn((text) => {
    // Mock successful parse
    const mockGroup = {
      traverse: jest.fn()
    };
    return mockGroup;
  })
}));

export const GLTFLoader = jest.fn().mockImplementation(() => ({
  load: jest.fn((url, onLoad, onProgress, onError) => {
    // Mock successful load
    const mockScene = {
      traverse: jest.fn()
    };
    setTimeout(() => onLoad(mockScene), 100);
  }),
  parse: jest.fn((data) => {
    // Mock successful parse
    const mockScene = {
      traverse: jest.fn()
    };
    return mockScene;
  })
}));



const Image = require("@11ty/eleventy-img");
const CleanCSS = require("clean-css");
const sitemap = require("@quasibit/eleventy-plugin-sitemap");
const path = require("path");

async function imageShortcode(src, alt, sizes = "100vw") {
  // Resolve relative paths from src/img/
  const imgSrc = src.startsWith("/") ? path.join("./src", src) : src;

  let metadata = await Image(imgSrc, {
    widths: [400, 800, 1200],
    formats: ["webp", "jpeg"],
    outputDir: "./public/img/",
    urlPath: "/img/",
  });

  return Image.generateHTML(metadata, {
    alt,
    sizes,
    loading: "lazy",
    decoding: "async",
  });
}

async function heroImageShortcode(src, alt, sizes = "100vw") {
  const imgSrc = src.startsWith("/") ? path.join("./src", src) : src;

  let metadata = await Image(imgSrc, {
    widths: [400, 800, 1200],
    formats: ["webp", "jpeg"],
    outputDir: "./public/img/",
    urlPath: "/img/",
  });

  return Image.generateHTML(metadata, {
    alt,
    sizes,
    fetchpriority: "high",
    decoding: "async",
  });
}

module.exports = function (eleventyConfig) {
  // Image shortcodes
  eleventyConfig.addAsyncShortcode("image", imageShortcode);
  eleventyConfig.addAsyncShortcode("heroImage", heroImageShortcode);

  // Sitemap plugin
  eleventyConfig.addPlugin(sitemap, {
    sitemap: {
      hostname: "https://bikelabs.com",
    },
  });

  // CSS minification transform
  eleventyConfig.addTransform("cssmin", function (content, outputPath) {
    if (outputPath && outputPath.endsWith(".css")) {
      return new CleanCSS({}).minify(content).styles;
    }
    return content;
  });

  // Pass through static assets
  eleventyConfig.addPassthroughCopy("src/img");
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/robots.txt");

  // Collections
  eleventyConfig.addCollection("reviews", (collectionApi) =>
    collectionApi
      .getFilteredByGlob("src/articles/reviews/**/*.md")
      .sort((a, b) => b.date - a.date)
  );
  eleventyConfig.addCollection("bikes", (collectionApi) =>
    collectionApi
      .getFilteredByGlob("src/articles/bikes/**/*.md")
      .sort((a, b) => b.date - a.date)
  );
  eleventyConfig.addCollection("culture", (collectionApi) =>
    collectionApi
      .getFilteredByGlob("src/articles/culture/**/*.md")
      .sort((a, b) => b.date - a.date)
  );
  eleventyConfig.addCollection("howto", (collectionApi) =>
    collectionApi
      .getFilteredByGlob("src/articles/how-to/**/*.md")
      .sort((a, b) => b.date - a.date)
  );
  eleventyConfig.addCollection("allArticles", (collectionApi) =>
    collectionApi
      .getFilteredByGlob("src/articles/**/*.md")
      .sort((a, b) => b.date - a.date)
  );

  // Date filter
  eleventyConfig.addFilter("dateDisplay", (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  });

  eleventyConfig.addFilter("dateISO", (date) => {
    return new Date(date).toISOString();
  });

  // Reading time filter (rough estimate: 200 words/min)
  eleventyConfig.addFilter("readingTime", (content) => {
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  });

  // Absolute URL filter
  eleventyConfig.addFilter("absoluteUrl", (url, base) => {
    try {
      return new URL(url, base).toString();
    } catch {
      return url;
    }
  });

  return {
    dir: {
      input: "src",
      output: "public",
      includes: "_includes",
      data: "_data",
    },
    templateFormats: ["njk", "md", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};

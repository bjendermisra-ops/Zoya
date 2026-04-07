export const ToolHandler = {
  openWebsite: (args: { url: string }) => {
    window.open(args.url, '_blank');
    return { success: true, message: `Opened ${args.url}` };
  },
  playLiveDarshan: (args: { location: string }) => {
    const query = encodeURIComponent(`${args.location} ISKCON live darshan`);
    window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
    return { success: true, message: `Playing live darshan for ${args.location}` };
  },
  openYouTube: (args: { query: string }) => {
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(args.query)}`, '_blank');
    return { success: true, message: `Opened YouTube for ${args.query}` };
  },
  openISKCONApp: () => {
    window.open('https://iskcon.org/', '_blank');
    return { success: true, message: `Opened ISKCON website/app` };
  },
  openDonationPage: () => {
    window.open('https://iskcon.org/donate/', '_blank');
    return { success: true, message: `Opened donation page` };
  },
  openLecture: (args: { topic: string }) => {
    const query = encodeURIComponent(`Srila Prabhupada lecture ${args.topic}`);
    window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
    return { success: true, message: `Opened lecture on ${args.topic}` };
  },
  openTempleLocation: (args: { location: string }) => {
    const query = encodeURIComponent(`ISKCON temple ${args.location}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    return { success: true, message: `Opened map for temple in ${args.location}` };
  }
};

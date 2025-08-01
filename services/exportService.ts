import jsPDF from 'jspdf';
import { ExportData, Meal, UserProfile } from '../types';

export class ExportService {
  
  // Export meals to CSV
  static exportToCSV(meals: Meal[], userProfile: UserProfile): void {
    const headers = [
      'Date',
      'Time', 
      'Dish Name',
      'Calories',
      'Health Score',
      'Diet Compatible',
      'Ingredients',
      'Health Tips',
      'Medical Safe',
      'Warnings'
    ];

    const csvData = meals.map(meal => [
      new Date(meal.timestamp).toLocaleDateString(),
      new Date(meal.timestamp).toLocaleTimeString(),
      meal.analysis.dishName,
      meal.analysis.estimatedCalories,
      meal.healthScore,
      meal.analysis.dietCompatibility.isCompatible ? 'Yes' : 'No',
      meal.analysis.ingredients.join('; '),
      meal.analysis.healthTips.join('; '),
      meal.analysis.medicalAdvice?.isSafeForConditions ? 'Yes' : 'No',
      meal.analysis.medicalAdvice?.warnings.join('; ') || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    this.downloadFile(
      csvContent,
      `healthy-me-meals-${new Date().toISOString().split('T')[0]}.csv`,
      'text/csv'
    );
  }

  // Export detailed report to PDF
  static exportToPDF(exportData: ExportData): void {
    const pdf = new jsPDF();
    let yPosition = 20;

    // Header
    pdf.setFontSize(20);
    pdf.setTextColor(34, 197, 94); // Green color
    pdf.text('🥗 Healthy Me - Nutrition Report', 20, yPosition);
    yPosition += 15;

    // User Info
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`User: ${exportData.user.displayName}`, 20, yPosition);
    yPosition += 7;
    pdf.text(`Diet: ${exportData.user.diet}`, 20, yPosition);
    yPosition += 7;
    pdf.text(`Export Date: ${new Date(exportData.exportDate).toLocaleDateString()}`, 20, yPosition);
    yPosition += 15;

    // BMI Info
    if (exportData.user.bmi) {
      pdf.setFontSize(14);
      pdf.text('BMI Information', 20, yPosition);
      yPosition += 10;
      pdf.setFontSize(10);
      pdf.text(`BMI: ${exportData.user.bmi.value} (${exportData.user.bmi.category})`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Height: ${exportData.user.bmi.height}cm, Weight: ${exportData.user.bmi.weight}kg`, 20, yPosition);
      yPosition += 15;
    }

    // Analytics Summary
    pdf.setFontSize(14);
    pdf.text('Analytics Summary', 20, yPosition);
    yPosition += 10;
    pdf.setFontSize(10);
    pdf.text(`Total Meals Analyzed: ${exportData.analytics.totalMeals}`, 20, yPosition);
    yPosition += 7;
    pdf.text(`Average Calories: ${exportData.analytics.avgCalories} kcal`, 20, yPosition);
    yPosition += 7;
    pdf.text(`Average Health Score: ${exportData.analytics.avgHealthScore}/20`, 20, yPosition);
    yPosition += 7;
    pdf.text(`Current Streak: ${exportData.analytics.streak} days`, 20, yPosition);
    yPosition += 15;

    // Recent Meals (last 10)
    const recentMeals = exportData.meals.slice(-10);
    pdf.setFontSize(14);
    pdf.text('Recent Meals', 20, yPosition);
    yPosition += 10;

    recentMeals.forEach((meal, index) => {
      if (yPosition > 270) { // New page if needed
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(12);
      pdf.setTextColor(34, 197, 94);
      pdf.text(`${index + 1}. ${meal.analysis.dishName}`, 20, yPosition);
      yPosition += 7;
      
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Date: ${new Date(meal.timestamp).toLocaleDateString()}`, 25, yPosition);
      yPosition += 5;
      pdf.text(`Calories: ${meal.analysis.estimatedCalories} kcal | Health Score: ${meal.healthScore}/20`, 25, yPosition);
      yPosition += 5;
      
      if (meal.analysis.medicalAdvice && !meal.analysis.medicalAdvice.isSafeForConditions) {
        pdf.setTextColor(220, 38, 38);
        pdf.text(`⚠️ Medical Warning: ${meal.analysis.medicalAdvice.warnings[0] || 'Check with doctor'}`, 25, yPosition);
        pdf.setTextColor(0, 0, 0);
        yPosition += 5;
      }
      yPosition += 8;
    });

    // Medical Conditions
    if (exportData.user.medicalConditions.length > 0) {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(14);
      pdf.text('Medical Conditions', 20, yPosition);
      yPosition += 10;
      pdf.setFontSize(10);
      exportData.user.medicalConditions.forEach(condition => {
        pdf.text(`• ${condition}`, 25, yPosition);
        yPosition += 7;
      });
    }

    pdf.save(`healthy-me-report-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  // Generate shareable meal card
  static generateMealCard(meal: Meal): string {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d')!;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 800, 600);
    gradient.addColorStop(0, '#10B981');
    gradient.addColorStop(1, '#059669');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);

    // White card background
    ctx.fillStyle = 'white';
    ctx.roundRect(40, 40, 720, 520, 20);
    ctx.fill();

    // Title
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🥗 Healthy Me', 400, 100);

    // Dish name
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#059669';
    ctx.fillText(meal.analysis.dishName, 400, 150);

    // Stats
    ctx.font = '24px Arial';
    ctx.fillStyle = '#374151';
    ctx.textAlign = 'left';
    ctx.fillText(`🔥 ${meal.analysis.estimatedCalories} calories`, 80, 220);
    ctx.fillText(`⭐ Health Score: ${meal.healthScore}/20`, 80, 260);
    
    const compatibilityIcon = meal.analysis.dietCompatibility.isCompatible ? '✅' : '❌';
    ctx.fillText(`${compatibilityIcon} Diet Compatible`, 80, 300);

    // Health tip
    ctx.font = '18px Arial';
    ctx.fillStyle = '#6B7280';
    const tip = meal.analysis.healthTips[0] || 'Enjoy your meal!';
    const words = tip.split(' ');
    let line = '';
    let y = 360;
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > 640 && n > 0) {
        ctx.fillText(line, 80, y);
        line = words[n] + ' ';
        y += 25;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 80, y);

    // Date
    ctx.font = '16px Arial';
    ctx.fillStyle = '#9CA3AF';
    ctx.textAlign = 'right';
    ctx.fillText(new Date(meal.timestamp).toLocaleDateString(), 720, 520);

    return canvas.toDataURL('image/png');
  }

  private static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

import pdfMake from 'pdfmake/build/pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { Doc } from '../model/firebase';
import { User } from '../model/user.model';

export class FileManager {
  public static readonly createPdfUser = (users: Doc<User>[]): void => {
    const fillColor = (index: number) => (index % 2 ? '#d2d3e1' : '#ffffff');

    const docDefinition: TDocumentDefinitions = {
      content: [
        { text: 'UTENTI FANTA DISCO', style: 'header' },
        {
          table: {
            headerRows: 1,
            widths: ['*', '*', 'auto', 70, 60],
            body: [
              [
                { text: 'Nome', style: 'tableHeader' },
                { text: 'Cognome', style: 'tableHeader' },
                { text: 'Email', style: 'tableHeader' },
                { text: 'Compleanno', style: 'tableHeader' },
                { text: 'Data di iscrizione', style: 'tableHeader' }
              ],
              ...users.map(({ props }, index) => [
                { text: props.name, style: 'tableCell', fillColor: fillColor(index) },
                { text: props.lastName, style: 'tableCell', fillColor: fillColor(index) },
                { text: props.email, style: 'tableCell', fillColor: fillColor(index) },
                {
                  text: new Date(props.birthDate).toLocaleDateString(),
                  style: 'tableCell',
                  fillColor: fillColor(index)
                },
                {
                  text: props.registeredAt ? new Date(props.registeredAt).toLocaleDateString() : '',
                  style: 'tableCell',
                  fillColor: fillColor(index)
                }
              ])
            ]
          }
        }
      ],
      styles: {
        header: { fontSize: 22, bold: true, marginBottom: 20, alignment: 'center' },
        tableHeader: { bold: true, fillColor: '#51518B', color: '#FFFFFF', alignment: 'center' },
        tableCell: { fontSize: 10 }
      }
    };

    pdfMake.createPdf(docDefinition).download('utenti-fanta-disco.pdf');
  };

  public static readonly createCsvUser = (users: Doc<User>[]): void => {
    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`; // Gestisce virgolette nel CSV

    const header = ['Nome', 'Cognome', 'Email', 'Compleanno', 'Data di iscrizione'];
    const rows = users.map(({ props }) => [
      props.name,
      props.lastName,
      props.email,
      new Date(props.birthDate).toLocaleDateString(),
      props.registeredAt ? new Date(props.registeredAt).toLocaleDateString() : ''
    ]);

    const csvContent = [
      header.map(escapeCsv).join(','), // Aggiunge header con escaping
      ...rows.map((row) => row.map(escapeCsv).join(',')) // Aggiunge dati con escaping
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'utenti-fanta-disco.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
}
